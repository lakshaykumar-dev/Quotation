import { Directive, ElementRef, HostListener, Input } from '@angular/core';

@Directive({
  selector: '[appNumberOnly]',
  standalone: true
})
export class NumberOnlyDirective {
  @Input() allowDecimals: boolean = true;
  @Input() allowNegative: boolean = false;

  private navigationKeys = [
    'Backspace', 'Delete', 'Tab', 'Escape', 'Enter', 'Home', 'End',
    'ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'
  ];

  constructor(private el: ElementRef<HTMLInputElement>) {}

  @HostListener('keydown', ['$event'])
  onKeyDown(event: KeyboardEvent) {
    const e = event;

    // Allow navigation keys
    if (
      this.navigationKeys.indexOf(e.key) > -1 ||
      (e.key === 'a' && (e.ctrlKey || e.metaKey)) || // Ctrl+A
      (e.key === 'c' && (e.ctrlKey || e.metaKey)) || // Ctrl+C
      (e.key === 'v' && (e.ctrlKey || e.metaKey)) || // Ctrl+V
      (e.key === 'x' && (e.ctrlKey || e.metaKey))    // Ctrl+X
    ) {
      return;
    }

    const currentVal = this.el.nativeElement.value || '';
    
    // Allow decimal point
    if (this.allowDecimals && e.key === '.') {
      if (currentVal.indexOf('.') === -1) {
        return;
      } else {
        e.preventDefault();
        return;
      }
    }

    // Allow minus sign
    if (this.allowNegative && e.key === '-') {
      if (currentVal.indexOf('-') === -1 && this.el.nativeElement.selectionStart === 0) {
        return;
      } else {
        e.preventDefault();
        return;
      }
    }

    // Block non-numeric characters (allow 0-9 digits)
    if (e.key === ' ' || isNaN(Number(e.key))) {
      e.preventDefault();
    }
  }

  @HostListener('paste', ['$event'])
  onPaste(event: ClipboardEvent) {
    const clipboardData = event.clipboardData;
    const pastedText = clipboardData ? clipboardData.getData('text') : '';
    
    let regexStr = '^[0-9]*$';
    if (this.allowDecimals) {
      regexStr = '^[0-9]*\\.?[0-9]*$';
    }
    if (this.allowNegative) {
      regexStr = '^-?[0-9]*\\.?[0-9]*$';
    }
    
    const regEx = new RegExp(regexStr);
    if (!regEx.test(pastedText)) {
      event.preventDefault();
    }
  }
}
