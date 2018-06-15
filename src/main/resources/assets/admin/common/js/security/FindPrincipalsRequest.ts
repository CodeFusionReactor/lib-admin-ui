module api.security {

    export class FindPrincipalsRequest
        extends api.security.SecurityResourceRequest<FindPrincipalsResultJson, FindPrincipalsResult> {

        private requiredRoles: PrincipalKey[];
        private allowedTypes: PrincipalType[];
        private searchQuery: string;
        private userStoreKey: UserStoreKey;
        private filterPredicate: (principal: Principal) => boolean;
        private from: number;
        private size: number;

        constructor() {
            super();
            super.setMethod('GET');
        }

        getParams(): Object {
            return {
                types: this.enumToStrings(this.allowedTypes),
                roles: this.rolesToString(this.requiredRoles),
                query: this.searchQuery || null,
                userStoreKey: this.userStoreKey ? this.userStoreKey.toString() : null,
                from: this.from || null,
                size: this.size || null
            };
        }

        getRequestPath(): api.rest.Path {
            return api.rest.Path.fromParent(super.getResourcePath(), 'principals');
        }

        sendAndParse(): wemQ.Promise<FindPrincipalsResult> {
            return this.send().then((response: api.rest.JsonResponse<FindPrincipalsResultJson>) => {
                let principals: Principal[] = response.getResult().principals.map((principalJson: PrincipalJson) => {
                    return this.fromJsonToPrincipal(principalJson);
                });
                if (this.filterPredicate) {
                    principals = principals.filter(this.filterPredicate);
                }
                return new FindPrincipalsResult(principals, response.getResult().hits, response.getResult().totalSize);
            });
        }

        private enumToStrings(types: PrincipalType[]): string {
            return types ? types.map((type: PrincipalType) => PrincipalType[type].toUpperCase()).join(',') : undefined;
        }

        private rolesToString(roles: PrincipalKey[]): string {
            return roles ? roles.map(role => role.toString()).join(',') : undefined;
        }

        setUserStoreKey(key: UserStoreKey): FindPrincipalsRequest {
            this.userStoreKey = key;
            return this;
        }

        setAllowedTypes(types: PrincipalType[]): FindPrincipalsRequest {
            this.allowedTypes = types;
            return this;
        }

        getAllowedTypes(): PrincipalType[] {
            return this.allowedTypes;
        }

        setRequiredRoles(roles: PrincipalKey[]): FindPrincipalsRequest {
            this.requiredRoles = roles;
            return this;
        }

        getRequiredRoles(): PrincipalKey[] {
            return this.requiredRoles;
        }

        setFrom(from: number): FindPrincipalsRequest {
            this.from = from;
            return this;
        }

        getFrom(): number {
            return this.from;
        }

        setSize(size: number): FindPrincipalsRequest {
            this.size = size;
            return this;
        }

        setSearchQuery(query: string): FindPrincipalsRequest {
            this.searchQuery = query;
            return this;
        }

        setResultFilter(filterPredicate: (principal: Principal) => boolean) {
            this.filterPredicate = filterPredicate;
        }
    }
}
