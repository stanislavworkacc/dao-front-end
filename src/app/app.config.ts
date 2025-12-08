import {
    ApplicationConfig,
    provideBrowserGlobalErrorListeners,
    provideZonelessChangeDetection,
} from '@angular/core';
import {provideAnimationsAsync} from '@angular/platform-browser/animations/async';
import {providePrimeNG} from 'primeng/config';
import {provideRouter} from '@angular/router';
import Nora from '@primeng/themes/nora';

import {routes} from './app.routes';
import {MessageService} from "primeng/api";
import {DialogService, DynamicDialogModule} from "primeng/dynamicdialog";
import {provideHttpClient} from "@angular/common/http";

export const appConfig: ApplicationConfig = {
    providers: [
        DialogService,
        MessageService,
        provideAnimationsAsync(),
        provideHttpClient(),
        providePrimeNG({
            theme: {
                preset: Nora,
            },
        }),
        provideBrowserGlobalErrorListeners(),
        provideZonelessChangeDetection(),
        provideRouter(routes),
    ],
};
