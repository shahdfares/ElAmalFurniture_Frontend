import { ChangeDetectorRef, Component } from '@angular/core';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthServices } from '../services/auth-services';


@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  form: FormGroup;

  showPassword = false;
  loading = false;
  errorMessage = '';
  lastLogin: string | null = null;

  constructor(
    private fb: FormBuilder,
    private auth: AuthServices,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {
    this.form = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required]],
      remember: [true],
    });

    this.lastLogin = localStorage.getItem('lastLogin');

    if (this.auth.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  get email() { return this.form.get('email')!; }
  get password() { return this.form.get('password')!; }

  togglePassword(): void {
    this.showPassword = !this.showPassword;
  }

  dismissNotice(): void {
    this.lastLogin = null;
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.loading = true;
    this.errorMessage = '';

    const { email, password, remember } = this.form.value;

    this.auth.login({ email, password }, remember).subscribe({
      next: () => {
        localStorage.setItem('lastLogin', new Date().toLocaleString());
        this.loading = false;
        this.router.navigate(['/home']);
      },
      error: (err) => {
        this.loading = false;
        this.errorMessage =
          err.status === 400 || err.status === 401
            ? 'Invalid email or password.'
            : 'Something went wrong. Please try again.';
        this.cdr.detectChanges();
      },
    });
  }
}
