import "server-only";

import type {
  ArchiveListingImageMetadataInput,
  ArchiveRentalListingInput,
  CreateListingImageMetadataInput,
  CreateRentalListingInput,
  RentalListingAdminAdapter,
  RentalListingAdminResult,
  UpdateListingImageMetadataInput,
  UpdateRentalListingInput
} from "./types";

const unavailableResult: RentalListingAdminResult = {
  ok: false,
  status: "unavailable",
  reason: "listing_admin_unavailable"
};

export class DisabledRentalListingAdmin implements RentalListingAdminAdapter {
  async createListing(
    _input: CreateRentalListingInput
  ): Promise<RentalListingAdminResult> {
    return unavailableResult;
  }

  async updateListing(
    _input: UpdateRentalListingInput
  ): Promise<RentalListingAdminResult> {
    return unavailableResult;
  }

  async archiveListing(
    _input: ArchiveRentalListingInput
  ): Promise<RentalListingAdminResult> {
    return unavailableResult;
  }

  async createListingImage(
    _input: CreateListingImageMetadataInput
  ): Promise<RentalListingAdminResult> {
    return unavailableResult;
  }

  async updateListingImage(
    _input: UpdateListingImageMetadataInput
  ): Promise<RentalListingAdminResult> {
    return unavailableResult;
  }

  async archiveListingImage(
    _input: ArchiveListingImageMetadataInput
  ): Promise<RentalListingAdminResult> {
    return unavailableResult;
  }
}

export const disabledRentalListingAdmin = new DisabledRentalListingAdmin();
