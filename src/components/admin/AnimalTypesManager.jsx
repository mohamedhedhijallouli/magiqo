import React from "react";
import { AnimalTypes } from "@/lib/db";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export default function AnimalTypesManager() {
  return (
    <TaxonomyManager
      collection={AnimalTypes}
      collectionName="animal_types"
      titleKey="atm_title"
      newKey="atm_new"
      emptyKey="atm_empty"
    />
  );
}
