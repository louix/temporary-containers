import { expect, preferencesTestSet, loadBackground } from './setup';
import { Cookie } from '~/types';

preferencesTestSet.map(preferences => {
  describe(`preferences: ${JSON.stringify(preferences)}`, () => {
    describe('Set Cookies', () => {
      it('should set the cookie and add it to the header if allowed', async () => {
        const { tmp: background, browser } = await loadBackground({
          preferences,
        });

        const cookie: Cookie = {
          domain: 'domain',
          expirationDate: '123',
          firstPartyDomain: 'firstPartyDomain',
          httpOnly: 'true',
          name: 'name',
          path: '/foo/bar',
          sameSite: '',
          secure: 'true',
          url: 'https://example.com',
          value: 'value',
        };
        browser.cookies.get.resolves(cookie);
        background.storage.local.preferences.cookies.domain = {
          'example.com': [cookie],
        };

        const tab = await background.container.createTabInTempContainer({});
        const results = await browser.tabs._navigate(
          tab?.id,
          'https://example.com',
          {
            requestHeaders: [{ name: 'Cookie', value: 'foo=bar; moo=foo' }],
          }
        );

        browser.cookies.set.should.have.been.calledWith({
          domain: 'domain',
          expirationDate: 123,
          firstPartyDomain: 'firstPartyDomain',
          httpOnly: true,
          name: 'name',
          path: '/foo/bar',
          sameSite: undefined,
          secure: true,
          url: 'https://example.com',
          value: 'value',
          storeId: tab?.cookieStoreId,
        });

        (await results.onBeforeSendHeaders[0]).should.deep.match({
          url: 'https://example.com',
          requestHeaders: [
            { name: 'Cookie', value: 'foo=bar; moo=foo; name=value' },
          ],
        });
      });

      it('should set the cookie and not add it to the header if not allowed', async () => {
        const { tmp: background, browser, helper } = await loadBackground({
          preferences,
        });
        await helper.openNewTmpTab({
          createsContainer: 'firefox-tmp1',
        });
        const cookie: Cookie = {
          domain: 'domain',
          expirationDate: '123',
          httpOnly: '',
          name: 'name',
          path: '/foo/bar',
          secure: 'true',
          url: 'https://example.com',
          value: 'value',
          firstPartyDomain: '',
          sameSite: '',
        };
        browser.cookies.get.resolves(null);
        background.storage.local.preferences.cookies.domain = {
          'example.com': [cookie],
        };
        const [
          promise,
        ] = (browser.webRequest.onBeforeSendHeaders.addListener.yield({
          tabId: 1,
          url: 'https://example.com',
          requestHeaders: [{ name: 'Cookie', value: 'foo=bar; moo=foo' }],
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as unknown) as any[];
        const result = await promise;
        browser.cookies.set.should.have.been.called;
        expect(result).to.be.undefined;
      });

      it('should do nothing if its not a temporary container', async () => {
        const { tmp: background, browser } = await loadBackground({
          preferences,
          initialize: false,
        });
        browser.tabs.get.resolves({
          cookieStoreId: 'firefox-default',
        });
        await background.initialize();

        const cookie: Cookie = {
          domain: 'domain',
          expirationDate: '123',
          httpOnly: '',
          name: 'name',
          path: '/foo/bar',
          secure: 'true',
          url: 'https://example.com',
          value: 'value',
          firstPartyDomain: '',
          sameSite: '',
        };

        background.storage.local.preferences.cookies.domain = {
          'example.com': [{ ...cookie, name: 'example', value: 'content' }],
        };
        const [
          response,
        ] = (browser.webRequest.onBeforeSendHeaders.addListener.yield({
          url: 'https://example.com',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
        }) as unknown) as any[];
        expect(await response).to.be.undefined;
      });
    });
  });
});
