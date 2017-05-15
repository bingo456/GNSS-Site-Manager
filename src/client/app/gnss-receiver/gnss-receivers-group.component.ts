import { Component } from '@angular/core';
import { FormBuilder } from '@angular/forms';
import { AbstractGroupComponent } from '../shared/abstract-groups-items/abstract-group.component';
import { GnssReceiverViewModel } from './gnss-receiver-view-model';

/**.
 * This class represents a group of GNSS Receivers.
 */
@Component({
    moduleId: module.id,
    selector: 'gnss-receivers-group',
    templateUrl: 'gnss-receivers-group.component.html',
})
export class GnssReceiversGroupComponent extends AbstractGroupComponent<GnssReceiverViewModel> {
    constructor(protected formBuilder: FormBuilder) {
        super(formBuilder);
    }

    getItemName(): string {
        return 'GNSS Receiver';
    }

    getControlName(): string {
        return 'gnssReceivers';
    }

    compare(obj1: GnssReceiverViewModel, obj2: GnssReceiverViewModel): number {
        return GnssReceiversGroupComponent.compare(obj1, obj2);
    }

    /* **************************************************
     * Other methods
     */
    newItemViewModel(blank?: boolean): GnssReceiverViewModel {
        return new GnssReceiverViewModel(blank);
    }
}
