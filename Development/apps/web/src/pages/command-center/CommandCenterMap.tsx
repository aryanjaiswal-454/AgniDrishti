import React from "react";
import { GisMapContainer, GisMapContainerProps } from "../../components/map";

export type CommandCenterMapProps = GisMapContainerProps;

export const CommandCenterMap: React.FC<CommandCenterMapProps> = (props) => {
  return <GisMapContainer {...props} />;
};

