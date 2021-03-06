module api.util.htmlarea.editor {
    import StringHelper = api.util.StringHelper;

    export class HTMLAreaHelper {

        static imagePrefix: string = 'image://';
        static maxImageWidth: number = 640;

        private static getConvertedImageSrc(imgSrc: string): string {
            let contentId = HTMLAreaHelper.extractContentIdFromImgSrc(imgSrc);
            let scaleValue = HTMLAreaHelper.extractScaleParamFromImgSrc(imgSrc);
            let imageUrl = new api.content.util.ContentImageUrlResolver().setContentId(new api.content.ContentId(contentId)).setScaleWidth(
                true).setScale(scaleValue).setSize(HTMLAreaHelper.maxImageWidth).resolve();

            return ` src="${imageUrl}" data-src="${imgSrc}"`;
        }

        private static extractContentIdFromImgSrc(imgSrc: string): string {
            if (imgSrc.indexOf('?') !== -1) {
                return StringHelper.substringBetween(imgSrc, HTMLAreaHelper.imagePrefix, '?');
            }

            return imgSrc.replace(HTMLAreaHelper.imagePrefix, StringHelper.EMPTY_STRING);
        }

        private static extractScaleParamFromImgSrc(imgSrc: string): string {
            if (imgSrc.indexOf('scale=') !== -1) {
                return api.util.UriHelper.decodeUrlParams(imgSrc.replace('&amp;', '&'))['scale'];
            }

            return null;
        }

        public static prepareImgSrcsInValueForEdit(value: string): string {
            let processedContent = value;
            let regex = /<img.*?src="(.*?)"/g;
            let imgSrcs;

            if (!processedContent) {
                return '';
            }

            while (processedContent.search(` src="${HTMLAreaHelper.imagePrefix}`) > -1) {
                imgSrcs = regex.exec(processedContent);
                if (imgSrcs) {
                    imgSrcs.forEach((imgSrc: string) => {
                        if (imgSrc.indexOf(HTMLAreaHelper.imagePrefix) === 0) {
                            processedContent =
                                processedContent.replace(` src="${imgSrc}"`, HTMLAreaHelper.getConvertedImageSrc(imgSrc));
                        }
                    });
                }
            }
            return processedContent;
        }

        public static prepareEditorImageSrcsBeforeSave(editorContent: string): string {
            const regex: RegExp = /<img.*?data-src="(.*?)".*?>/g;
            let processedContent: string = editorContent;

            AppHelper.whileTruthy(() => regex.exec(editorContent), (imgTags) => {
                const imgTag = imgTags[0];

                if (imgTag.indexOf('<img ') === 0 && imgTag.indexOf(HTMLAreaHelper.imagePrefix) > 0) {
                    const dataSrc = /<img.*?data-src="(.*?)".*?>/.exec(imgTag)[1];
                    const src = /<img.*?src="(.*?)".*?>/.exec(imgTags[0])[1];

                    const convertedImg = imgTag.replace(src, dataSrc).replace(` data-src="${dataSrc}"`, StringHelper.EMPTY_STRING);
                    processedContent = processedContent.replace(imgTag, convertedImg);
                }
            });

            return processedContent;
        }

        public static updateImageAlignmentBehaviour(editor: HtmlAreaEditor) {
            let imgs = editor.getBody().querySelectorAll('img');

            for (let i = 0; i < imgs.length; i++) {
                this.changeImageParentAlignmentOnImageAlignmentChange(imgs[i]);
                this.updateImageParentAlignment(imgs[i]);
            }
        }

        public static changeImageParentAlignmentOnImageAlignmentChange(img: HTMLImageElement) {
            let observer = new MutationObserver((mutations) => {
                mutations.forEach((mutation) => {
                    let alignment = (<HTMLElement>mutation.target).style.textAlign;
                    HTMLAreaHelper.updateImageParentAlignment(img, alignment);
                });
            });

            let config = {attributes: true, childList: false, characterData: false, attributeFilter: ['style']};

            observer.observe(img, config);
        }

        public static updateImageParentAlignment(image: HTMLElement, alignment?: string) {
            if (!alignment) {
                alignment = image.style.textAlign;
            }

            let styleFormat = 'float: {0}; margin: {1};' +
                              (HTMLAreaHelper.isImageInOriginalSize(image) ? '' : 'width: {2}%;');
            let styleAttr = '';

            image.parentElement.className = '';

            switch (alignment) {
            case 'left':
            case 'right':
                styleAttr = StringHelper.format(styleFormat, alignment, '15px', '40');
                break;
            case 'center':
                styleAttr = StringHelper.format(styleFormat, 'none', 'auto', '60');
                image.parentElement.classList.add(alignment);
                break;
            case 'justify':
                image.parentElement.classList.add(alignment);
                break;
            }

            image.parentElement.setAttribute('style', styleAttr);
            image.parentElement.setAttribute('data-mce-style', styleAttr);
        }

        private static isImageInOriginalSize(image: HTMLElement) {
            return image.getAttribute('data-src').indexOf('keepSize=true') > 0;
        }
    }
}
