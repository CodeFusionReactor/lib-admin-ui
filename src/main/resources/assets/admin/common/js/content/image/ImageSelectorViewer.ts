namespace api.content.image {

    export class ImageSelectorViewer
        extends api.ui.NamesAndIconViewer<ImageTreeSelectorItem> {

        constructor() {
            super();
        }

        resolveDisplayName(object: ImageTreeSelectorItem): string {
            return object.getDisplayName();
        }

        resolveUnnamedDisplayName(object: ImageTreeSelectorItem): string {
            return object.getTypeLocaleName();
        }

        resolveSubName(object: ImageTreeSelectorItem): string {
            return object.getPath() ? object.getPath().toString() : '';
        }

        resolveIconUrl(object: ImageTreeSelectorItem): string {
            return object.getImageUrl() + '&size=270';
        }

        resolveHint(object: api.content.image.ImageTreeSelectorItem): string {
            return object.getPath().toString();
        }

        protected getHintTargetEl(): api.dom.ElementHelper {
            return this.getNamesAndIconView().getIconImageEl().getEl();
        }
    }
}
