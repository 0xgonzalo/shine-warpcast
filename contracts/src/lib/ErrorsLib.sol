// SPDX-License-Identifier: MIT
pragma solidity ^0.8.13;

/**
   ____                         
  / _____________  _______      
 / _// __/ __/ _ \/ __(_-<      
/___/_/ /_/  \___/_/ /___/      
                                
   __   _ __                    
  / /  (_/ /  _______ _______ __
 / /__/ / _ \/ __/ _ `/ __/ // /
/____/_/_.__/_/  \_,_/_/  \_, / 
                         /___/  

 * @title Errors Library
 * @author 11:11 Labs
 * @notice This library defines custom errors for the Shine platform.
 */

library ErrorsLib {
    /// @notice Thrown when the sender is not authorized to perform the action
    error SenderIsNotAuthorized();
    
    /// @notice Thrown when invalid metadata input is provided (empty strings or zero address)
    error InvalidMetadataInput();
    
    /// @notice Thrown when an operation is attempted on an empty list/array
    error ListIsEmpty();
    
    /// @notice Thrown when an invalid or non-existent song ID is provided
    error InvalidSongId();
    
    /// @notice Thrown when a user tries to purchase a song they already own
    error UserOwnsSong();
    
    /// @notice Thrown when trying to set a new admin address to zero address
    error NewAdminAddressCannotBeZero();
    
    /// @notice Thrown when trying to execute an admin proposal that hasn't been proposed
    error NewAdminNotProposed();
    
    /// @notice Thrown when trying to execute an admin proposal before the required time has passed
    error TimeToExecuteProposalNotReached();
    
    /// @notice Thrown when admin tries to burn ETH from the contract
    error AdminCantBurnEth();
    
    /// @notice Thrown when an amount of zero is provided where a positive value is required
    error AmountCannotBeZero();
    
    /// @notice Thrown when the provided amount is too low for the required operation
    /// @param actual The actual amount provided
    /// @param required The minimum required amount
    error AmountTooLow(uint256 actual, uint256 required);

    /// @notice Thrown when the maximum supply for a special edition song has been reached
    error EspecialEditionMaxSupplyReached();
}
