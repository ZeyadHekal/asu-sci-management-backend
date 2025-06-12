export interface SoftwareConfig {
    name: string;
    requiredMemory: string;
    requiredStorage: string;
}

export const SOFTWARES_CONFIG: SoftwareConfig[] = [
    {
        name: 'VS Code',
        requiredMemory: '2GB',
        requiredStorage: '300MB',
    },
    {
        name: 'Visual Studio',
        requiredMemory: '4GB',
        requiredStorage: '10GB',
    },
    {
        name: 'Matlab',
        requiredMemory: '8GB',
        requiredStorage: '15GB',
    },
    {
        name: 'Unity',
        requiredMemory: '6GB',
        requiredStorage: '12GB',
    },
]; 