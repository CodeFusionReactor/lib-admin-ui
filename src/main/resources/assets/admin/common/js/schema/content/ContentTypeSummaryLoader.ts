namespace api.schema.content {

    import BaseLoader = api.util.loader.BaseLoader;
    import ContentTypeSummaryListJson = api.schema.content.ContentTypeSummaryListJson;

    export class ContentTypeSummaryLoader
        extends BaseLoader<ContentTypeSummaryListJson, ContentTypeSummary> {

        constructor(contentId: ContentId) {
            super(contentId ? new GetContentTypesByContentRequest(contentId) : new GetAllContentTypesRequest());
        }

        filterFn(contentType: ContentTypeSummary) {
            return contentType.getContentTypeName().toString().indexOf(this.getSearchString().toLowerCase()) !== -1;
        }

    }

}
