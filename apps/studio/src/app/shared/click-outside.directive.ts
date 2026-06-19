import { Directive, ElementRef, inject, output, OnDestroy, OnInit } from '@angular/core';

@Directive({
  selector: '[clickOutside]',
  standalone: true,
})
export class ClickOutsideDirective implements OnInit, OnDestroy {
  private elementRef = inject(ElementRef);
  clickOutside = output<void>();
  private handler: ((event: MouseEvent) => void) | null = null;

  ngOnInit() {
    this.handler = (event: MouseEvent) => {
      if (!this.elementRef.nativeElement.contains(event.target as Node)) {
        this.clickOutside.emit();
      }
    };
    document.addEventListener('click', this.handler, true);
  }

  ngOnDestroy() {
    if (this.handler) {
      document.removeEventListener('click', this.handler, true);
    }
  }
}
