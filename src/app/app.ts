import {Component, DestroyRef, inject} from '@angular/core';
import {RouterOutlet} from "@angular/router";
import {Toast} from "primeng/toast";
import {SiweOverlayComponent} from "./components/siwe-overlay/siwe-overlay.component";

@Component({
    selector: 'app-root',
    standalone: true,
    templateUrl: './app.html',
    styleUrl: './app.scss',
    imports: [
        RouterOutlet,
        SiweOverlayComponent,
        Toast,
    ],
})
export class App {
}
