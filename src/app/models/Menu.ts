export interface HijoMenu {
    displayName: string;
    iconName: string;
    route: string;
}

export interface ModuloMenu {
    displayName: string;
    iconName: string;
    route: string;
    children: HijoMenu[];
}

export interface CategoriaMenu {
    category: string;
    modulos: ModuloMenu[];
}

export interface AccesoMenu {
    permitido: boolean;
}
