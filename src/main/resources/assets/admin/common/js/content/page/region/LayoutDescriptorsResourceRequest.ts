namespace api.content.page.region {

    export class LayoutDescriptorsResourceRequest extends LayoutDescriptorResourceRequest<LayoutDescriptorsJson, LayoutDescriptor[]> {

        fromJsonToLayoutDescriptors(json: LayoutDescriptorsJson): LayoutDescriptor[] {

            let array: LayoutDescriptor[] = [];
            json.descriptors.forEach((descriptorJson: LayoutDescriptorJson)=> {
                array.push(this.fromJsonToLayoutDescriptor(descriptorJson));
            });
            return array;
        }

    }
}
