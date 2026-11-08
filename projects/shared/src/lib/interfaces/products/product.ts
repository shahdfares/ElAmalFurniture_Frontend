import { ProductImages } from "./product-images";
import { ProductTechnicalSpecification } from "./product-technical-specification";


export interface Product {
  id: string,
  name:string
  code: string,
  description: string,
  slug: string,
  categoryId: string,
  category: string,
  categorySlug: string,
  productImages: ProductImages[],
  technicalSpecification: ProductTechnicalSpecification[]
}
