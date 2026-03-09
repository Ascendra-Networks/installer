import { ProviderOption } from "../types";

export const CLOUD_PROVIDERS: ProviderOption[] = [
  {
    id: "aws",
    name: "Amazon Web Services",
    description: "Deploy on AWS cloud infrastructure",
    icon: "aws",
    available: true,
  },
  {
    id: "azure",
    name: "Microsoft Azure",
    description: "Deploy on Azure cloud platform",
    icon: "azure",
    available: false,
  },
  {
    id: "gcp",
    name: "Google Cloud Platform",
    description: "Deploy on Google Cloud infrastructure",
    icon: "gcp",
    available: false,
  },
  {
    id: "on-premise",
    name: "On-Premises",
    description: "Deploy on your own infrastructure",
    icon: "server",
    available: true,
  },
];
