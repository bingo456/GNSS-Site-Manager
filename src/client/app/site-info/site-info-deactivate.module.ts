import { CanDeactivate } from '@angular/router';
import { SiteInfoComponent } from './site-info.component';

export class ConfirmDeactivateSiteInfoGuard implements CanDeactivate<SiteInfoComponent> {

  canDeactivate(target: SiteInfoComponent): Promise<boolean> {
    if(target.hasChanges()) {
        return target.confirmCloseSiteInfoPage();
    }
    return Promise.resolve(true);
  }
}