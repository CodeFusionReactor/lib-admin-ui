namespace api.content.json {

    export interface ContentJson extends ContentSummaryJson {

        data: api.data.PropertyArrayJson[];

        attachments: api.content.attachment.AttachmentJson[];

        meta: api.content.json.ExtraDataJson[];

        page: api.content.page.PageJson;

        permissions: api.security.acl.AccessControlEntryJson[];

        inheritPermissions: boolean;
    }
}
