namespace api.content {

    export class ContentSummaryViewer extends api.ui.NamesAndIconViewer<ContentSummary> {

        constructor() {
            super('content-summary-viewer');
        }

        resolveDisplayName(object: ContentSummary): string {
            let contentName = object.getName();
            let invalid = !object.isValid() || !object.getDisplayName() || contentName.isUnnamed();
            let pendingDelete = object.getContentState().isPendingDelete();
            this.toggleClass('invalid', invalid);
            this.toggleClass('pending-delete', pendingDelete);

            return object.getDisplayName();
        }

        resolveUnnamedDisplayName(object: ContentSummary): string {
            return object.getType() ? object.getType().getLocalName() : '';
        }

        resolveSubName(object: ContentSummary, relativePath: boolean = false): string {
            let contentName = object.getName();
            if (relativePath) {
                return !contentName.isUnnamed() ? object.getName().toString() :
                       api.content.ContentUnnamed.prettifyUnnamed();
            } else {
                return !contentName.isUnnamed() ? object.getPath().toString() :
                                                  ContentPath.fromParent(object.getPath().getParentPath(),
                                                      api.content.ContentUnnamed.prettifyUnnamed()).toString();
            }
        }

        resolveSubTitle(object: ContentSummary): string {
            return object.getPath().toString();
        }

        resolveIconUrl(object: ContentSummary): string {
            return new api.content.util.ContentIconUrlResolver().setContent(object).resolve();
        }
    }
}
