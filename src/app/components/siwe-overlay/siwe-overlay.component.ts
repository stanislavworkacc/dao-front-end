import {ChangeDetectionStrategy, Component, inject} from '@angular/core';
import {BlockUI} from "primeng/blockui";
import {Web3AuthService} from "../../core/services/web3-auth.service";

// Добавив оверлей щоб блокувати юзера під час видачі токену (підпису)
@Component({
    selector: 'app-siwe-overlay',
    imports: [
        BlockUI,
    ],
    templateUrl: './siwe-overlay.component.html',
    styleUrl: './siwe-overlay.component.scss',
    changeDetection: ChangeDetectionStrategy.OnPush,
    standalone: true
})
export class SiweOverlayComponent {
    readonly auth: Web3AuthService = inject(Web3AuthService);
}
