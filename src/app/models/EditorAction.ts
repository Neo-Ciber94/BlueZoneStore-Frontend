
export interface Add {
    type: 'add'
}

export interface Update {
    id: number,
    type: 'update'
}

export interface Delete {
    id: number,
    type: 'delete'
}

export interface Details {
    id: number;
    type: 'details'
}

export type EditorAction = Add | Update | Delete | Details;