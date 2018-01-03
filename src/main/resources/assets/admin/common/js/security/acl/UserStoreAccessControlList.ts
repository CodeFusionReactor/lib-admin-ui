namespace api.security.acl {

    export class UserStoreAccessControlList implements api.Equitable {

        private entries: {[key: string]: UserStoreAccessControlEntry};

        constructor(entries?: UserStoreAccessControlEntry[]) {
            this.entries = {};
            if (entries) {
                this.addAll(entries);
            }
        }

        getEntries(): UserStoreAccessControlEntry[] {
            let values = [];
            for (let key in this.entries) {
                if (this.entries.hasOwnProperty(key)) {
                    values.push(this.entries[key]);
                }
            }
            return values;
        }

        getEntry(principalKey: PrincipalKey): UserStoreAccessControlEntry {
            return this.entries[principalKey.toString()];
        }

        add(entry: UserStoreAccessControlEntry): void {
            this.entries[entry.getPrincipal().getKey().toString()] = entry;
        }

        addAll(entries: UserStoreAccessControlEntry[]): void {
            entries.forEach((entry) => {
                this.entries[entry.getPrincipal().getKey().toString()] = entry;
            });
        }

        contains(principalKey: PrincipalKey): boolean {
            return this.entries.hasOwnProperty(principalKey.toString());
        }

        remove(principalKey: PrincipalKey): void {
            delete this.entries[principalKey.toString()];
        }

        toJson(): api.security.acl.UserStoreAccessControlEntryJson[] {
            let acl: api.security.acl.UserStoreAccessControlEntryJson[] = [];
            this.getEntries().forEach((entry: api.security.acl.UserStoreAccessControlEntry) => {
                let entryJson = entry.toJson();
                acl.push(entryJson);
            });
            return acl;
        }

        toString(): string {
            return '[' + this.getEntries().sort().map((ace) => ace.toString()).join(', ') + ']';
        }

        equals(o: api.Equitable): boolean {

            if (!api.ObjectHelper.iFrameSafeInstanceOf(o, UserStoreAccessControlList)) {
                return false;
            }

            let other = <UserStoreAccessControlList>o;
            return this.toString() === other.toString();
        }

        static fromJson(json: api.security.acl.UserStoreAccessControlEntryJson[]): UserStoreAccessControlList {
            let acl = new UserStoreAccessControlList();
            json.forEach((entryJson: api.security.acl.UserStoreAccessControlEntryJson) => {
                let entry = UserStoreAccessControlEntry.fromJson(entryJson);
                acl.add(entry);
            });
            return acl;
        }

        clone(): UserStoreAccessControlList {
            let result = new UserStoreAccessControlList();
            this.getEntries().forEach((item) => {
                let clonedItem = new UserStoreAccessControlEntry(item.getPrincipal().clone(), item.getAccess());
                result.add(clonedItem);
            });

            return result;
        }
    }
}
