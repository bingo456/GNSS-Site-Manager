import { Component } from '@angular/core';
import { AbstractGroupComponent } from '../shared/abstract-groups-items/abstract-group.component';
import { FrequencyStandardViewModel } from './frequency-standard-view-model';
import { FormBuilder } from '@angular/forms';
import { SiteLogService } from '../shared/site-log/site-log.service';

/**
 * This class represents a collection of FrequencyStandard Component.
 */
@Component({
    moduleId: module.id,
    selector: 'frequency-standard-group',
    templateUrl: 'frequency-standard-group.component.html',
})
export class FrequencyStandardGroupComponent extends AbstractGroupComponent<FrequencyStandardViewModel> {

    constructor(protected siteLogService: SiteLogService, formBuilder: FormBuilder) {
        super(siteLogService, formBuilder);
    }

    getItemName(): string {
        return 'Frequency Standard';
    }

    getControlName(): string {
        return 'frequencyStandards';
    }

    getNewItemViewModel(): FrequencyStandardViewModel {
        return new FrequencyStandardViewModel();
    }
}
