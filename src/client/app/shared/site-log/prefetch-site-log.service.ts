import { Injectable } from '@angular/core';
import { Router, Resolve, ActivatedRouteSnapshot, RouterStateSnapshot } from '@angular/router';
import { DialogService, SiteLogService } from '../index';
import { SiteLogViewModel } from '../json-data-view-model/view-model/site-log-view-model';

@Injectable()
export class PrefetchSiteLogResolver implements Resolve<SiteLogViewModel> {

    constructor(private router: Router,
                private dialogService: DialogService,
                private siteLogService: SiteLogService) {
    }

    resolve(route: ActivatedRouteSnapshot, state: RouterStateSnapshot): Promise<SiteLogViewModel> {
        let homeUrl: string = '/';
        let fourCharacterId: string = route.params['id'];
        if (!fourCharacterId) {
            this.router.navigate([homeUrl]);
            return null;
        } else if (fourCharacterId === 'newSite') {
            return Promise.resolve(new SiteLogViewModel());
        }

        return this.siteLogService.getSiteLogByFourCharacterId(fourCharacterId)
            .then((result: any) => {
                return <SiteLogViewModel>result;
            })
            .catch((error: any): any => {
                this.router.navigate([homeUrl]);
                this.dialogService.showErrorMessage('No site log found for ' + fourCharacterId);
                return null;
            });
    }
}
