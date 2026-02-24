import type { Preview } from "@storybook/react";
import "../styles/index.css";

const preview: Preview = {
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },
    backgrounds: {
      default: "dark",
      values: [
        { name: "dark", value: "#09090b" },
        { name: "zinc-900", value: "#18181b" },
        { name: "light", value: "#ffffff" },
      ],
    },
  },
  decorators: [
    (Story) => (
      <div className="dark text-white">
        <Story />
      </div>
    ),
  ],
};

export default preview;

