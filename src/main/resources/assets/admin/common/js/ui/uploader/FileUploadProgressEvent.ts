namespace api.ui.uploader {

    export class FileUploadProgressEvent<MODEL extends api.Equitable> {

        private uploadItem: UploadItem<MODEL>;

        constructor(uploadItem: UploadItem<MODEL>) {
            this.uploadItem = uploadItem;
        }

        getUploadItem(): UploadItem<MODEL> {
            return this.uploadItem;
        }

    }
}
