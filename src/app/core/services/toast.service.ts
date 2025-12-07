import { Injectable, inject } from '@angular/core';
import { MessageService } from 'primeng/api';

@Injectable({ providedIn: 'root' })
export class ToastService {
    private readonly messageService: MessageService = inject(MessageService);

    success(summary: string, detail?: string, life = 3000): void {
        this.messageService.add({
            severity: 'success',
            summary,
            detail,
            life,
        });
    }

    info(summary: string, detail?: string, life = 3000): void {
        this.messageService.add({
            severity: 'info',
            summary,
            detail,
            life,
        });
    }

    warn(summary: string, detail?: string, life = 4000): void {
        this.messageService.add({
            severity: 'warn',
            summary,
            detail,
            life,
        });
    }

    error(summary: string, detail?: string, life = 5000): void {
        this.messageService.add({
            severity: 'error',
            summary,
            detail,
            life,
        });
    }

    clear(): void {
        this.messageService.clear();
    }
}