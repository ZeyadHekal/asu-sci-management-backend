export interface DeviceSpecConfig {
	category: string;
	value: string;
}

export interface DeviceConfig {
	IPAddress: string;
	labName: string;
	assistantUsername: string;
	hasIssue?: boolean;
	specifications: DeviceSpecConfig[];
}

export const DEVICES_CONFIG: DeviceConfig[] = [
	// Abd El Salam Lab Devices (12 devices)
	{
		IPAddress: '192.168.1.101',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 1TB 7200RPM' },
			{ category: 'Processor', value: 'Intel Core i5-9400 2.9GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce GTX 1650 4GB' },
		],
	},
	{
		IPAddress: '192.168.1.102',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 512GB + HDD 1TB' },
			{ category: 'Processor', value: 'Intel Core i7-10700 3.6GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3060 8GB' },
		],
	},
	{
		IPAddress: '192.168.1.103',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: true,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 500GB 7200RPM' },
			{ category: 'Processor', value: 'Intel Core i3-8100 3.6GHz' },
			{ category: 'Graphics', value: 'Intel UHD Graphics 630' },
		],
	},
	{
		IPAddress: '192.168.1.104',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 1TB NVMe' },
			{ category: 'Processor', value: 'AMD Ryzen 5 3600 3.6GHz' },
			{ category: 'Graphics', value: 'AMD Radeon RX 580 8GB' },
		],
	},
	{
		IPAddress: '192.168.1.105',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 1TB 7200RPM' },
			{ category: 'Processor', value: 'Intel Core i5-9400 2.9GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce GTX 1050 Ti 4GB' },
		],
	},
	{
		IPAddress: '192.168.1.106',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 32GB' },
			{ category: 'Storage', value: 'SSD 2TB NVMe' },
			{ category: 'Processor', value: 'Intel Core i9-11900K 3.5GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3080 10GB' },
		],
	},
	{
		IPAddress: '192.168.1.107',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 12GB' },
			{ category: 'Storage', value: 'HDD 2TB 5400RPM' },
			{ category: 'Processor', value: 'AMD Ryzen 7 2700X 3.7GHz' },
			{ category: 'Graphics', value: 'AMD Radeon RX 570 4GB' },
		],
	},
	{
		IPAddress: '192.168.1.108',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'SSD 256GB + HDD 1TB' },
			{ category: 'Processor', value: 'Intel Core i5-8400 2.8GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce GTX 1660 6GB' },
		],
	},
	{
		IPAddress: '192.168.1.109',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 512GB NVMe' },
			{ category: 'Processor', value: 'AMD Ryzen 5 5600X 3.7GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 2060 6GB' },
		],
	},
	{
		IPAddress: '192.168.1.110',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: true,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 4GB' },
			{ category: 'Storage', value: 'HDD 320GB 5400RPM' },
			{ category: 'Processor', value: 'Intel Pentium G4560 3.5GHz' },
			{ category: 'Graphics', value: 'Intel HD Graphics 610' },
		],
	},
	{
		IPAddress: '192.168.1.111',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 24GB' },
			{ category: 'Storage', value: 'SSD 1TB + HDD 2TB' },
			{ category: 'Processor', value: 'Intel Core i7-9700K 3.6GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 2070 8GB' },
		],
	},
	{
		IPAddress: '192.168.1.112',
		labName: 'Abd El Salam',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'SSD 128GB + HDD 500GB' },
			{ category: 'Processor', value: 'AMD Ryzen 3 3200G 3.6GHz' },
			{ category: 'Graphics', value: 'AMD Radeon Vega 8' },
		],
	},

	// Bahaa Lab Devices (11 devices)
	{
		IPAddress: '192.168.2.201',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 512GB NVMe' },
			{ category: 'Processor', value: 'Intel Core i7-10700 3.6GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3060 Ti 8GB' },
		],
	},
	{
		IPAddress: '192.168.2.202',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 1TB 7200RPM' },
			{ category: 'Processor', value: 'AMD Ryzen 5 3600 3.6GHz' },
			{ category: 'Graphics', value: 'AMD Radeon RX 5600 XT 6GB' },
		],
	},
	{
		IPAddress: '192.168.2.203',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 32GB' },
			{ category: 'Storage', value: 'SSD 1TB NVMe + HDD 2TB' },
			{ category: 'Processor', value: 'Intel Core i9-10900K 3.7GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3070 8GB' },
		],
	},
	{
		IPAddress: '192.168.2.204',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: true,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 500GB 5400RPM' },
			{ category: 'Processor', value: 'Intel Core i3-9100 3.6GHz' },
			{ category: 'Graphics', value: 'Intel UHD Graphics 630' },
		],
	},
	{
		IPAddress: '192.168.2.205',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 256GB + HDD 1TB' },
			{ category: 'Processor', value: 'AMD Ryzen 7 3700X 3.6GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce GTX 1660 Super 6GB' },
		],
	},
	{
		IPAddress: '192.168.2.206',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 12GB' },
			{ category: 'Storage', value: 'SSD 512GB SATA' },
			{ category: 'Processor', value: 'Intel Core i5-10400 2.9GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce GTX 1650 Super 4GB' },
		],
	},
	{
		IPAddress: '192.168.2.207',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 2TB 7200RPM' },
			{ category: 'Processor', value: 'AMD Ryzen 5 2600 3.4GHz' },
			{ category: 'Graphics', value: 'AMD Radeon RX 580 8GB' },
		],
	},
	{
		IPAddress: '192.168.2.208',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 64GB' },
			{ category: 'Storage', value: 'SSD 2TB NVMe' },
			{ category: 'Processor', value: 'Intel Core i9-11900K 3.5GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3080 Ti 12GB' },
		],
	},
	{
		IPAddress: '192.168.2.209',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 1TB SATA' },
			{ category: 'Processor', value: 'AMD Ryzen 7 5700X 3.4GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 2060 Super 8GB' },
		],
	},
	{
		IPAddress: '192.168.2.210',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'SSD 128GB + HDD 1TB' },
			{ category: 'Processor', value: 'Intel Core i3-10100 3.6GHz' },
			{ category: 'Graphics', value: 'Intel UHD Graphics 630' },
		],
	},
	{
		IPAddress: '192.168.2.211',
		labName: 'Bahaa',
		assistantUsername: 'admin',
		hasIssue: true,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 4GB' },
			{ category: 'Storage', value: 'HDD 250GB 5400RPM' },
			{ category: 'Processor', value: 'Intel Celeron G5905 3.5GHz' },
			{ category: 'Graphics', value: 'Intel UHD Graphics 610' },
		],
	},

	// Basement Lab Devices (13 devices)
	{
		IPAddress: '192.168.3.301',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 1TB NVMe' },
			{ category: 'Processor', value: 'AMD Ryzen 9 5900X 3.7GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3070 Ti 8GB' },
		],
	},
	{
		IPAddress: '192.168.3.302',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 1TB 7200RPM' },
			{ category: 'Processor', value: 'Intel Core i5-11400 2.6GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce GTX 1660 Ti 6GB' },
		],
	},
	{
		IPAddress: '192.168.3.303',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 32GB' },
			{ category: 'Storage', value: 'SSD 512GB + HDD 2TB' },
			{ category: 'Processor', value: 'Intel Core i7-11700K 3.6GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3060 12GB' },
		],
	},
	{
		IPAddress: '192.168.3.304',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 12GB' },
			{ category: 'Storage', value: 'SSD 256GB NVMe' },
			{ category: 'Processor', value: 'AMD Ryzen 5 5600G 3.9GHz' },
			{ category: 'Graphics', value: 'AMD Radeon Vega 7' },
		],
	},
	{
		IPAddress: '192.168.3.305',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: true,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 500GB 5400RPM' },
			{ category: 'Processor', value: 'Intel Core i3-8100 3.6GHz' },
			{ category: 'Graphics', value: 'Intel UHD Graphics 630' },
		],
	},
	{
		IPAddress: '192.168.3.306',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 24GB' },
			{ category: 'Storage', value: 'SSD 1TB SATA + HDD 3TB' },
			{ category: 'Processor', value: 'AMD Ryzen 7 5800X 3.8GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3080 10GB' },
		],
	},
	{
		IPAddress: '192.168.3.307',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 512GB NVMe' },
			{ category: 'Processor', value: 'Intel Core i5-10600K 4.1GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 2070 Super 8GB' },
		],
	},
	{
		IPAddress: '192.168.3.308',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'HDD 2TB 7200RPM' },
			{ category: 'Processor', value: 'AMD Ryzen 3 3100 3.6GHz' },
			{ category: 'Graphics', value: 'AMD Radeon RX 5500 XT 4GB' },
		],
	},
	{
		IPAddress: '192.168.3.309',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 128GB' },
			{ category: 'Storage', value: 'SSD 4TB NVMe' },
			{ category: 'Processor', value: 'Intel Core i9-12900K 3.2GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3090 24GB' },
		],
	},
	{
		IPAddress: '192.168.3.310',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 16GB' },
			{ category: 'Storage', value: 'SSD 1TB SATA' },
			{ category: 'Processor', value: 'AMD Ryzen 5 4600G 3.7GHz' },
			{ category: 'Graphics', value: 'AMD Radeon Vega 7' },
		],
	},
	{
		IPAddress: '192.168.3.311',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 8GB' },
			{ category: 'Storage', value: 'SSD 256GB + HDD 1TB' },
			{ category: 'Processor', value: 'Intel Core i5-9400F 2.9GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce GTX 1050 Ti 4GB' },
		],
	},
	{
		IPAddress: '192.168.3.312',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: true,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 4GB' },
			{ category: 'Storage', value: 'HDD 320GB 5400RPM' },
			{ category: 'Processor', value: 'Intel Pentium Gold G5400 3.7GHz' },
			{ category: 'Graphics', value: 'Intel UHD Graphics 610' },
		],
	},
	{
		IPAddress: '192.168.3.313',
		labName: 'Basement',
		assistantUsername: 'admin',
		hasIssue: false,
		specifications: [
			{ category: 'Memory', value: 'DDR4 RAM 48GB' },
			{ category: 'Storage', value: 'SSD 2TB NVMe + HDD 4TB' },
			{ category: 'Processor', value: 'AMD Ryzen 9 5950X 3.4GHz' },
			{ category: 'Graphics', value: 'NVIDIA GeForce RTX 3090 Ti 24GB' },
		],
	},
];
