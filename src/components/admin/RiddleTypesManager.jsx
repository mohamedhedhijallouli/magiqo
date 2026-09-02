import React from "react";
import { RiddleTypes } from "@/lib/db";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export default function RiddleTypesManager() {
  return (
    <TaxonomyManager
      collection={RiddleTypes}
      collectionName="riddle_types"
      titleKey="rtm_title"
      newKey="rtm_new"
      emptyKey="rtm_empty"
    />
  );
}
