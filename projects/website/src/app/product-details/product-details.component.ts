import { ChangeDetectorRef, Component, HostListener, OnDestroy, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Product, ProductImages, ProductServices } from 'shared';

import {
  copyPageLink,
  isNativeShareSupported,
  nativeShareProduct,
  shareToNetwork,
} from './utils/product-share.util';
import { printProductSheet } from './utils/product-print.util';
import { downloadProductPdf } from './utils/product-pdf.util';

@Component({
  selector: 'app-product-details',
  standalone: false,
  templateUrl: './product-details.component.html',
  styleUrl: './product-details.component.css',
})
export class ProductDetailsComponent implements OnInit, OnDestroy {
  categorySlug: any;
  productSlug: any;
  productsDetails: Product | null = null;

  // Slider
  activeIndex = 0;
  private readonly slideInterval = 3000;
  private timer: any = null;

  // Actions state
  shareOpen = false;
  copied = false;
  pdfLoading = false;

  //Related category
  relatedProducts: Product[] = [];

  constructor(private _activatedRoute:ActivatedRoute,
              private _productServices:ProductServices,
              private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this._activatedRoute.paramMap.subscribe((param) => {
      this.categorySlug = param.get('categorySlug')
      this.productSlug = param.get('productSlug')

      this._productServices.getProductDetails(this.categorySlug,this.productSlug)
      .subscribe((res) =>{
        this.productsDetails = res

        const primary = res?.productImages?.findIndex((i:ProductImages) => i.isPrimary) ?? -1;
        this.activeIndex = primary > -1 ? primary : 0;
        this.startAutoPlay();
        this.cdr.detectChanges();

        window.scrollTo({ top: 0, behavior: 'smooth' });
        this.loadRelated(res);
      });
    });
  }

  ngOnDestroy(): void {
    this.stopAutoPlay();
  }

  // ---------- Slider ----------
  get images() {
    return this.productsDetails?.productImages ?? [];
  }

  get plateNumber(): string {
    return String(this.activeIndex + 1).padStart(2, '0');
  }

  selectImage(index: number): void {
    this.activeIndex = index;
    this.startAutoPlay();
  }

  private next(): void {
    if (this.images.length > 1) {
      this.activeIndex = (this.activeIndex + 1) % this.images.length;
      this.cdr.detectChanges();
    }
  }

  private startAutoPlay(): void {
    this.stopAutoPlay();
    if (this.images.length > 1) {
      this.timer = setInterval(() => this.next(), this.slideInterval);
    }
  }

  private stopAutoPlay(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
  }

  pause(): void { this.stopAutoPlay(); }
  resume(): void { this.startAutoPlay(); }

  // ---------- Actions ----------
  get canNativeShare(): boolean {
    return isNativeShareSupported();
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(e: Event): void {
    if (!(e.target as HTMLElement).closest('.pd-share')) {
      this.shareOpen = false;
    }
  }

  toggleShare(): void {
    this.shareOpen = !this.shareOpen;
  }

  shareTo(network: string): void {
    if (!this.productsDetails) return;
    shareToNetwork(network, this.productsDetails);
    this.shareOpen = false;
  }

  async copyLink(): Promise<void> {
  await copyPageLink();
  this.shareOpen = false;
  this.copied = true;
  this.cdr.detectChanges();

  setTimeout(() => {
    this.copied = false;
    this.cdr.detectChanges();
  }, 1600);
}

  nativeShare(): void {
    if (!this.productsDetails) return;
    nativeShareProduct(this.productsDetails);
    this.shareOpen = false;
  }

  printSheet(): void {
    if (this.productsDetails) printProductSheet(this.productsDetails);
  }

  async downloadPdf(): Promise<void> {
    if (!this.productsDetails || this.pdfLoading) return;

    this.pdfLoading = true;
    this.cdr.detectChanges();

    try {
      await downloadProductPdf(this.productsDetails);
    } catch (err) {
      console.error('PDF error', err);
      alert('Could not create the PDF. Please try again.');
    } finally {
      this.pdfLoading = false;
      this.cdr.detectChanges();
    }
  }

    // ---------- Related ----------
  private loadRelated(current: Product): void {
    this._productServices
      .getAll({ categorySlug: current.categorySlug })
      .subscribe((res) => {
        const list: Product[] = (res as any).data ?? (res as any).items ?? [];

        this.relatedProducts = list
          .filter((x) => x.slug !== current.slug)
          .slice(0, 4);

        this.cdr.detectChanges();
      });
  }

  relatedImage(p: Product): string {
    const imgs = p.productImages ?? [];
    return (imgs.find((i) => i.isPrimary) ?? imgs[0])?.imagesUrl ?? '';
  }
}
