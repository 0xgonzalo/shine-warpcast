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
