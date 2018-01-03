namespace api.ui.selector {

    import TreeNode = api.ui.treegrid.TreeNode;
    import PostLoader = api.util.loader.PostLoader;

    export abstract class OptionDataLoader<DATA>
        extends PostLoader<JSON, DATA> {

        abstract fetch(node: TreeNode<Option<DATA>>): wemQ.Promise<DATA>;

        abstract fetchChildren(parentNode: TreeNode<Option<DATA>>, from?: number, size?: number): wemQ.Promise<OptionDataLoaderData<DATA>>;

        abstract checkReadonly(options: DATA[]): wemQ.Promise<string[]>;

        abstract onLoadModeChanged(listener: (isTreeMode: boolean) => void);

        abstract unLoadModeChanged(listener: (isTreeMode: boolean) => void);
    }

    export class OptionDataLoaderData<DATA> {

        private data: DATA[];
        private hits: number;
        private totalHits: number;

        constructor(data: DATA[], hits?: number, totalHits?: number) {
            this.data = data;
            this.hits = hits;
            this.totalHits = totalHits;
        }

        public getData(): DATA[] {
            return this.data;
        }

        public getHits(): number {
            return this.hits;
        }

        public getTotalHits(): number {
            return this.totalHits;
        }
    }
}
