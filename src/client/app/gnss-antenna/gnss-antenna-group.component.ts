import { Component, Input, OnInit } from '@angular/core';
import { FormGroup, FormBuilder } from '@angular/forms';
import { AbstractGroup } from '../shared/abstract-groups-items/abstract-group';
import { GnssAntennaViewModel } from './gnss-antenna-view-model';
import { GnssAntennaItemComponent } from './gnss-antenna-item.component';

/**
 * This class represents a collection of GNSS Antenna items.
 */
@Component({
    moduleId: module.id,
    selector: 'gnss-antenna-group',
    templateUrl: 'gnss-antenna-group.component.html',
})
export class GnssAntennaGroupComponent extends AbstractGroup<GnssAntennaViewModel> implements OnInit {
    static compare(obj1: GnssAntennaViewModel, obj2: GnssAntennaViewModel): number {
        let date1: string = obj1.dateInstalled;
        let date2: string = obj2.dateInstalled;
        return AbstractGroup.compareDates(date1, date2);
    }

    @Input()
    set siteLogModel(siteLogModel: any) {
        if (siteLogModel) {
            this.setItemsCollection(siteLogModel.gnssAntennas);
            this.setupForm('gnssAntennas');
        }
    }

    @Input()
    set originalSiteLogModel(originalSiteLogModel: any) {
        originalSiteLogModel && this.setItemsOriginalCollection(originalSiteLogModel.gnssAntennas);
    }

    constructor(formBuilder: FormBuilder) {
        super(formBuilder);
    }

    ngOnInit() {
        // This is happening too early before itemProperties are set in the @Input
        // this.setupForm();
    }

    getItemName(): string {
        return 'GNSS Antenna';
    }

    compare(obj1: GnssAntennaViewModel, obj2: GnssAntennaViewModel): number {
        return GnssAntennaGroupComponent.compare(obj1, obj2);
    }

    newItemViewModel(blank?: boolean): GnssAntennaViewModel {
        return new GnssAntennaViewModel(blank);
    }

    newItemFormInstance(): FormGroup {
        return GnssAntennaItemComponent.newFormInstance(this.formBuilder);
    }
}
