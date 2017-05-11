import { Input } from '@angular/core';
import { FormGroup, FormArray, FormBuilder } from '@angular/forms';
import { AbstractBaseComponent } from './abstract-base.component';
import { GeodesyEvent, EventNames } from '../events-messages/Event';
import { AbstractViewModel } from '../json-data-view-model/view-model/abstract-view-model';
import { MiscUtils } from '../global/misc-utils';
import * as lodash from 'lodash';

export const sortingDirectionAscending: boolean = false;
export const newItemShouldBeBlank: boolean = true;
export const newItemShouldNotBeBlank: boolean = false;

export abstract class AbstractGroupComponent<T extends AbstractViewModel> extends AbstractBaseComponent {
    isGroupOpen: boolean = false;

    miscUtils: any = MiscUtils;
    protected groupArrayForm: FormArray;
    @Input() siteLogForm: FormGroup;

    @Input()
    set siteLogModel(siteLogModel: any) {
       if (siteLogModel) {
           this.setItemsCollection(this.getFormData(siteLogModel));
           this.setupForm(this.getControlName());
       }
    }

    @Input()
    set originalSiteLogModel(originalSiteLogModel: any) {
        if (originalSiteLogModel) {
            this.setItemsOriginalCollection(this.getFormData(originalSiteLogModel));
        }
    }

    /**
     * Event mechanism to communicate with children.  Simply change the value of this and the children detect the change.
     * @type {{name: EventNames}}
     */
    private geodesyEvent: GeodesyEvent = new GeodesyEvent(EventNames.none);

    /**
     * All the items.  They are stored in ascending order so that the oldest items are 'left-most' in the array, just like
     * in the itemOriginalProperties so that differences work to show the new items added.  The sorting field is determined
     * through the abstract method compare(left, right)).
     *
     * The display order on the form is in reverse with the oldest items at the bottom.  This is achieved with the method
     * getItemsCollection().
     *
     */
    private itemProperties: T[];

    /**
     * A backup of the original list of items.  Used to diff against upon Save.
     */
    private itemOriginalProperties: T[];

    /**
     * This is used in comparators but isn't a comparator - just a helper function.  In the comparator, extract the dates
     * (using getDateInstalled(), getBeginPositionDate(), ...) and return compareDates(date1, date2)
     * @param date1
     * @param date2
     * @param sortAscending - true if to sort ascendingly.  Const sortingDirectionAscending by default.
     * @return -1: date1 < date2; 1: date1 > date2; 0: date1 == date2 if descending or 1: date1 < date2; -1: date1 > date2 if ascending
     */
    public static compareDates(date1: string, date2: string, sortAscending: boolean = sortingDirectionAscending): number {
        let sortModifier: number = sortAscending ? 1 : -1;
        if (date1 < date2) {
            return -1 * sortModifier;
        } else if (date1 > date2) {
            return 1 * sortModifier;
        } else {
            return 0;
        }
    }

    constructor(protected formBuilder: FormBuilder) {
        super();
    }

    /**
     * Get the item name to be used in the subclasses and displayed in the HTML.
     */
    abstract getItemName(): string;

    abstract getControlName(): string;

    /**
     * The child class needs to define this to make an instance of itself.
     * @param blank - if to exclude all default values so it is completely blank.  Defaults to false.
     */
    abstract newItemViewModel(blank?: boolean): T;

    /**
     * Subclasses can create a comparator relevant for their data structures.  Reduce size in these by
     * using getDateInstalled(), getBeginPositionDate.
     *
     * @param obj1
     * @param obj2
     */
    abstract compare(obj1: AbstractViewModel, obj2: AbstractViewModel): number;

    getFormData(siteLog: any): any {
        return siteLog[this.getControlName()];
    }

    /**
     * Event mechanism to communicate with children.  Simply change the value of this and the children detect the change.
     *
     * @returns {GeodesyEvent}
     */
    getGeodesyEvent(): GeodesyEvent {
        return this.geodesyEvent;
    }

    getIsGroupOpen(): boolean {
        return this.isGroupOpen;
    }

    /**
     * Return collection - optionally with deleted items filter out.  Always in reverse order.  IT WILL NOT
     * change the original collection's order or composition.
     * @param showDeleted - false by default
     * @return {T[]}
     */
    getItemsCollection(showDeleted?: boolean): T[] {
        let doShowDeleted: boolean = true;
        if (showDeleted !== undefined) {
            doShowDeleted = showDeleted;
        }

        if (this.itemProperties) {
            let filteredOrNot: T[] = doShowDeleted ? lodash.clone(this.itemProperties) : this.itemProperties.filter(this.isntDeleted);
            return filteredOrNot;
        } else {
            return [];
        }
    }

    isEmptyCollection(): boolean {
        return (!this.itemProperties || this.itemProperties.length === 0);
    }

    getItemsOriginalCollection(): T[] {
        return this.itemOriginalProperties;
    }

    setItemsCollection(itemProperties: T[]) {
        this.itemProperties = itemProperties;
        if (itemProperties && itemProperties.length > 0) {
            this.sortUsingComparator(this.itemProperties);
        }
    }

    setItemsOriginalCollection(itemProperties: T[]) {
        this.itemOriginalProperties = itemProperties;
        if (itemProperties && itemProperties.length > 0) {
            this.sortUsingComparator(this.itemOriginalProperties);
        }
    }

    /**
     * @param item
     * @param origItem
     *
     * @return index in itemProperties (and FormArray) where item is inserted
     */
    addToItemsCollection(item: T, origItem: T): number {
        let indexAddedAt: number;
        if (sortingDirectionAscending) {
            this.itemProperties.push(item);
            this.itemOriginalProperties.push(origItem);
            indexAddedAt = this.itemProperties.length - 1;
        } else {
            this.itemProperties.splice(0, 0, item);
            this.itemOriginalProperties.splice(0, 0, origItem);
            indexAddedAt = 0;
        }
        this.addChildItemToForm();
        return indexAddedAt;
    }

    /**
     * This is the event handler called by children
     * @param geodesyEvent
     */
    returnEvents(geodesyEvent: GeodesyEvent) {
        switch (geodesyEvent.name) {
            case EventNames.removeItem:
                this.removeItem(geodesyEvent.valueNumber, geodesyEvent.valueString);
                break;
            case EventNames.cancelNew:
                this.cancelNew(geodesyEvent.valueNumber, geodesyEvent.valueString);
                break;
            default:
                console.log('returnEvents - unknown event: ', EventNames[geodesyEvent.name]);
        }
    }

    addNew(event: UIEvent) {
        event.preventDefault();
        this.addNewItem();
        this.newItemEvent();
    }

    /**
     * Setup the form for the group.  It will contain an array of Items.
     *
     * @param itemsArrayName that is set on the siteLogForm
     */
    setupForm(itemsArrayName: string) {
        this.groupArrayForm = this.formBuilder.array([]);
        if (this.siteLogForm.controls[itemsArrayName]) {
            this.siteLogForm.removeControl(itemsArrayName);
        }
        this.siteLogForm.addControl(itemsArrayName, this.groupArrayForm);

        this.setupChildItems();
    }

    setupChildItems() {
        for (let viewModel of this.getItemsCollection()) {
            this.addChildItemToForm();
        }
    }

    /**
     * The form data model needs to be updated when new items are added.
     *
     * @param isItDirty if to mark it dirty or not.
     */
    addChildItemToForm(isItDirty: boolean = false) {
        let itemGroup: FormGroup = this.formBuilder.group({});
        if (sortingDirectionAscending) {
            this.groupArrayForm.push(itemGroup);
        } else {
            this.groupArrayForm.insert(0, itemGroup);
        }
        if (isItDirty) {
            itemGroup.markAsDirty();
        }
    }

    /* ************** Methods called from the template ************** */

    /**
     * Remove an item.  Originally it was removed from the list.  However we now want to track deletes so
     * keep it and mark as deleted using change tracking.
     */
    public removeItem(itemIndex: number, reason: string) {
        // Be aware that the default order is one way (low to high start date), but what is displayed is the opposite
        // (high to low start date).  This call is coming from the UI (the display order) and the default for
        // getItemsCollection() is the reverse order so this works out ok
        this.setDeletedReason(itemIndex, reason);
        this.setDeleted(itemIndex);
    }

    /**
     * Permanently Remove an item.  Typically done when deleting an item just added and not yet persisted.
     */
    public cancelNew(itemIndex: number, reason: string) {
        // Be aware that the default order is one way (low to high start date), but what is displayed is the opposite
        // (high to low start date).  Thus to access the original dataItems we need to reverse the index.
        let newIndex: number = this.itemProperties.length - itemIndex - 1;
        this.itemProperties.splice(newIndex, 1);
    }


    public isFormDirty(): boolean {
        return this.groupArrayForm ? this.groupArrayForm.dirty : false;
    }

    public isFormInvalid(): boolean {
        return this.groupArrayForm && this.groupArrayForm.invalid;
    }

    /* ************** Private Methods ************** */

    private addNewItem(): void {
        this.isGroupOpen = true;

        if (!this.getItemsCollection()) {
            this.setItemsCollection([]);
        }

        let newItem: T = <T> this.newItemViewModel();
        let newItemOrig: T = this.newItemViewModel(newItemShouldBeBlank);

        let indexAddedAt: number = this.addToItemsCollection(newItem, newItemOrig);
        this.setInserted(indexAddedAt, newItem);

        if (this.itemProperties.length > 1) {
            this.updateSecondToLastItem();
        }

        // Let the parent form know that it now has a new child
        this.groupArrayForm.markAsDirty();
    }

    /**
     * Let the ViewModels do anything they like with the 2nd last (previous) item - such as set end/removal date.
     * Need to modify both the SiteLogModel and the form model.
     */
    private updateSecondToLastItem() {
        let updatedValue: Object;
        let index: number;
        if (sortingDirectionAscending) {
            index = this.itemProperties.length - 2;
        } else {
            index = 1;
        }
        updatedValue = this.itemProperties[index].setFinalValuesBeforeCreatingNewItem();
        if (updatedValue && Object.keys(updatedValue).length > 0) {
            let formGroup: FormGroup = <FormGroup>this.groupArrayForm.at(index);
            formGroup.patchValue(updatedValue);
            formGroup.markAsDirty();
            // If the Group hasn't been opened, no form controls will exist.  It is unusual for users to create a new Item without
            // looking at whatever normally exists.  If not opened then the modified fields won't get marked as dirty.
            // It this is a problem then we could create the form controls (see AbstractItem.patchForm())
            if (Object.keys(formGroup.controls).length > 0) {
                for (let key of Object.keys(updatedValue)) {
                    (<FormGroup>this.groupArrayForm.at(index)).controls[key].markAsDirty();
                }
            }
        }
    }

    /**
     * Use the Geodesy object defined comparator in compare() to sort the given collection inline.
     *
     * @param collection
     */
    private sortUsingComparator(collection: any[]) {
        collection.sort(this.compare);
    }

    private isntDeleted(item: T): boolean {
        return (!item.dateDeleted || item.dateDeleted.length === 0);
    }

    /**
     * After a new item is created 'EventNames.newItem' is sent so that item can init itself.
     */
    private newItemEvent() {
        let geodesyEvent: GeodesyEvent = this.getGeodesyEvent();
        geodesyEvent.name = EventNames.newItem;
        geodesyEvent.valueNumber = 0;
    }

    private setDeleted(index: number) {
        let item: T = this.getItemsCollection()[index];

        let date: string = item.setDateDeleted();
        this.updateFormControl(index, 'dateDeleted', date);
    }

    private setInserted(index: number, item: T) {
        let date: string = item.setDateInserted();
        this.updateFormControl(index, 'dateInserted', date);
    }

    private setDeletedReason(index: number, reason: string) {
        let item: T = this.getItemsCollection()[index];
        item.setDeletedReason(reason);
        this.updateFormControl(index, 'deletedReason', reason);
    }

    private updateFormControl(index: number, field: string, value: string) {
        if (this.groupArrayForm.length > index) {
            let formGroup: FormGroup = <FormGroup>this.groupArrayForm.at(index);
            if (formGroup.controls[field]) {
                formGroup.controls[field].setValue(value);
            }
        }
    }
}
