// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

library ErrorsLib {
    error SenderIsNotAuthorized();
    error InvalidMetadataInput();
    error ListIsEmpty();
    error InvalidAudioId();
    error UserOwnsAudio();
    error AudioMaxSupplyReached();
    error NewAdminAddressCannotBeZero();
    error NewAdminNotProposed();
    error TimeToExecuteProposalNotReached();
    error AdminCantBurnEth();
    error AmountCannotBeZero();
    error AmountTooLow(uint256 actual, uint256 required);
}
