import {Component, OnInit, Input} from '@angular/core';
import { Subscription } from 'rxjs/Subscription';
import { ServiceWorkerService } from '../shared/index';

/**
 * This class represents the SelectSiteComponent for searching and selecting CORS sites.
 */
@Component({
  moduleId: module.id,
  selector: 'gnss-receiever-info',
  templateUrl: 'gnss-receiver-info.component.html',
})
export class GnssReceiverInfoComponent implements OnInit {
  private serviceWorkerSubscription: Subscription;
  public errorMessage: string;
  private cacheItems: Array<string> = [];
  public hasNewReceiver: boolean = false;
  @Input() status: any;
  @Input() gnssReceivers: any;


  constructor(private serviceWorkerService: ServiceWorkerService) { }

  /**
   * Initialize relevant variables when the directive is instantiated
   */
  ngOnInit() {
    this.setupSubscriptions();
  }

  setupSubscriptions() {
    this.serviceWorkerSubscription = this.serviceWorkerService.clearCacheObservable.subscribe((isCacheChanged: boolean) => {
      if (isCacheChanged) {
        this.updateCacheList();
      }
    });
  }

  /**
   * Component method to retrieve the list of URLs cached in the Service Worker and to update the this.cacheItem array
   */
  updateCacheList = (): void => {
    this.serviceWorkerService.getCacheList().then((data: string[]) => {
      this.cacheItems.length = 0;
      this.cacheItems = data;
    }).catch((error: any) => {
      console.error('Caught error in updateCacheList:', error);
    });
  };

  /**
   * Returns the date string (YYYY-MM-DD) from the date-time string (YYYY-MM-DDThh:mm:ssZ)
   */
  public getDate(datetime: string) {
    if ( datetime === null || typeof datetime === 'undefined') {
      return '';
    } else if (datetime.length < 10) {
      return datetime;
    }
    return datetime.substring(0, 10);
  }


  /**
   * Returns true if all previous GNSS receivers are open, otherwise returns false
   */
  public arePrevReceiversOpen() {
    if(this.status.isReceiversOpen === null) {
      throw new Error('status.isReceiversOpen is null');
    }
    for (let i = 1; i < this.status.isReceiversOpen.length; i ++) {
      if (!this.status.isReceiversOpen[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Returns true if all previous GNSS receivers are closed, otherwise returns false
   */
  public arePrevReceiversClosed() {
    if(this.status.isReceiversOpen === null) {
      throw new Error('status.isReceiversOpen is null');
    }
    for (let i = 1; i < this.status.isReceiversOpen.length; i ++) {
      if (this.status.isReceiversOpen[i]) {
        return false;
      }
    }
    return true;
  }

  /**
   * Update the isOpen flags for all previous GNSS receivers,sko
   */
  public togglePrevReceivers(flag: boolean) {
    if(this.status.isReceiversOpen === null) {
      throw new Error('status.isReceiversOpen is null');
    }
    for (let i = 1; i < this.status.isReceiversOpen.length; i ++) {
      this.status.isReceiversOpen[i] = flag;
    }
  }

  /**
   * Add a new empty receiver as current one and push the 'old' current receiver into previous list
   */
  public addNewReceiver() {
    let presentDT = this.getPresentDateTime();
    if (!this.receivers) {
      this.receivers = [];
    }

    // Assign present date/time as default value to dateRemoved if it is empty
    if (this.receivers.length > 0) {
      this.status.isReceiversOpen[0] = false;
      let currentReceiver: any = this.receivers[0];
      if (!currentReceiver.dateRemoved.value[0] ) {
        currentReceiver.dateRemoved.value[0] = presentDT;
      }
    }

    // Create a new empty receiver with present date/time as default value to dateInstalled
    let newReceiver = {
      receiverType: {
        value: ''
      },
      manufacturerSerialNumber: '',
      serialNumber: '',
      firmwareVersion: '',
      satelliteSystem: [
        {
          codeListValue: '',
          value: ''
        }
      ],
      elevationCutoffSetting: '',
      dateInstalled: {
        value: ['']
      },
      dateRemoved: {
        value: ['']
      }
    };

    // Clone from one of GNSS Receiver objects so that the "new" receiver object can be saved
    let receiverObj: any = {};
    if ( this.siteLogModel.gnssReceivers && this.siteLogModel.gnssReceivers.length > 0 ) {
      receiverObj = this.cloneJsonObj(this.siteLogModel.gnssReceivers[0]);
    }

    // Keep a copy of the receiver object as the original one for comparison
    let receiverObjCopy: any = this.cloneJsonObj(receiverObj);
    receiverObjCopy.gnssReceiver = this.cloneJsonObj(newReceiver);
    this.siteLogOrigin.gnssReceivers.unshift(receiverObjCopy);

    newReceiver.dateInstalled.value[0] = presentDT;
    receiverObj.gnssReceiver = newReceiver;
    this.siteLogModel.gnssReceivers.unshift(receiverObj);

    // Add the new receiver as current one and open it by default
    this.receivers.unshift(newReceiver);
    this.status.isReceiversOpen.unshift(true);
    this.status.isReceiverGroupOpen = true;
    this.hasNewReceiver = true;
  }
}
