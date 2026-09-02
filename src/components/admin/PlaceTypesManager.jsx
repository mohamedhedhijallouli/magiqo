import React from "react";
import { PlaceTypes } from "@/lib/db";
import TaxonomyManager from "@/components/admin/TaxonomyManager";

export default function PlaceTypesManager() {
  return (
    <TaxonomyManager
      collection={PlaceTypes}
      collectionName="place_types"
      titleKey="plt_title"
      newKey="plt_new"
      emptyKey="plt_empty"
      showAllowsElements
    />
  );
}
