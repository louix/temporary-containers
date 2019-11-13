import { TemporaryContainers } from '../background';
import { Storage } from './storage';
import { PreferencesSchema, Tab } from '~/types';

export class PageAction {
  private background: TemporaryContainers;
  private pref!: PreferencesSchema;
  private storage!: Storage;

  constructor(background: TemporaryContainers) {
    this.background = background;
  }

  public initialize(): void {
    this.pref = this.background.pref;
    this.storage = this.background.storage;
  }

  public async showOrHide(activatedTab?: Tab): Promise<void> {
    if (!activatedTab) {
      const [activeTab] = (await browser.tabs.query({
        currentWindow: true,
        active: true,
      })) as Tab[];
      activatedTab = activeTab;
    }

    let color;
    if (
      activatedTab.cookieStoreId ===
      `${this.background.containerPrefix}-default`
    ) {
      color = 'gray';
    } else if (
      this.storage.local.tempContainers[activatedTab.cookieStoreId] &&
      this.storage.local.tempContainers[activatedTab.cookieStoreId].color
    ) {
      color = this.storage.local.tempContainers[activatedTab.cookieStoreId]
        .color;
    } else {
      const container = await browser.contextualIdentities.get(
        activatedTab.cookieStoreId
      );
      color = container.color;
    }
    browser.pageAction.setIcon({
      path: {
        '19': `icons/pageaction-${color}-19.svg`,
        '38': `icons/pageaction-${color}-38.svg`,
      },
      tabId: activatedTab.id,
    });
    if (!this.pref.pageAction) {
      browser.pageAction.hide(activatedTab.id);
    } else {
      browser.pageAction.show(activatedTab.id);
    }
  }
}
