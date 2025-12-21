import { Routes } from '@angular/router';
import {HomeComponent} from "./components/home/home.component";
import {ProposalsPageComponent} from "./components/proposals-page/proposals-page.component";
import {ProposalDetailsPageComponent} from "./components/proposal-details-page/proposal-details-page.component";

export const routes: Routes = [
    {
        path: '',
        component: HomeComponent
    },
    {
        path: 'proposals',
        component: ProposalsPageComponent
    },
    {
        path: 'proposals/:id',
        component: ProposalDetailsPageComponent
    }
];
