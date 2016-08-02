import { AbTestApiPage } from './app.po';

describe('ab-test-api App', function() {
  let page: AbTestApiPage;

  beforeEach(() => {
    page = new AbTestApiPage();
  });

  it('should display message saying app works', () => {
    page.navigateTo();
    expect(page.getParagraphText()).toEqual('app works!');
  });
});
