// @ts-nocheck
import React from "react";
import { EmptyState, Text } from "@hubspot/ui-extensions";
import { hubspot } from "@hubspot/ui-extensions";

hubspot.extend(() => {
  return <NewSettingsPage />;
});

const NewSettingsPage: React.FC = () => {
  return (
    <EmptyState title="Nothing here yet!" layout="vertical">
      <Text>Build your application settings page here!</Text>
    </EmptyState>
  );
};

export default NewSettingsPage;


