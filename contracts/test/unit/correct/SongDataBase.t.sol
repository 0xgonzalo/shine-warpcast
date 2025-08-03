// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {SongDataBase} from "@shine/SongDataBase.sol";
import {Constants} from "../../Constants.sol";

contract SongDataBaseTest is Test, Constants {
    SongDataBase public songDataBase;

    function setUp() public {
        songDataBase = new SongDataBase(ADMIN.Address);
    }

    function test_unitCorrect_newSong() public {
        uint256 songId = songDataBase.newSong(
            "Song Title",
            "Artist Name",
            "mediaURI",
            "metadataURI",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            1000
        );
        assertEq(songId, 1);

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);

        assertEq(song.title, "Song Title");
        assertEq(song.artistName, "Artist Name");
        assertEq(song.mediaURI, "mediaURI");
        assertEq(song.metadataURI, "metadataURI");
        assertEq(song.artistAddress, CREATOR1.Address);
        assertEq(song.price, 100);
        assertEq(song.timesBought, 0);
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1000);
    }

    modifier setSongs() {
        songDataBase.newSong(
            "Test Song Number 1",
            "Creator one",
            "testMediaURIForSong1",
            "testMetadataURI1",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            1000
        );

        songDataBase.newSong(
            "Test Song Number 2",
            "Creator two",
            "testMediaURIForSong2",
            "testMetadataURI2",
            CREATOR2.Address,
            new string[](0),
            200,
            false,
            "",
            0
        );

        _;
    }

    function test_unitCorrect_editSongMetadata() public setSongs {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR1.Address);
        songDataBase.editSongMetadata(
            1,
            "Edited Song Title",
            "Edited Artist Name",
            "editedMediaURI",
            "editedMetadataURI",
            CREATOR2.Address,
            newTags,
            150
        );
        vm.stopPrank();

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);
        assertEq(song.title, "Edited Song Title");
        assertEq(song.artistName, "Edited Artist Name");
        assertEq(song.mediaURI, "editedMediaURI");
        assertEq(song.metadataURI, "editedMetadataURI");
        assertEq(song.artistAddress, CREATOR2.Address);
        assertEq(song.price, 150);
        assertEq(song.timesBought, 0);
        assertEq(song.tags.length, 1);
        assertEq(song.tags[0], "editedTag");
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1000);
    }

    function test_unitCorrect_buy() public setSongs {
        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 1;
        songIds[1] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        songDataBase.buy{value: totalPrice}(songIds, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 2);
        assertEq(userCollection[0], 1);
        assertEq(userCollection[1], 2);

        SongDataBase.SongMetadata memory songOne = songDataBase.getSongMetadata(
            1
        );
        SongDataBase.SongMetadata memory songTwo = songDataBase.getSongMetadata(
            2
        );

        assertEq(songOne.timesBought, 1);
        assertEq(songTwo.timesBought, 1);

        //check amount on contract
        uint256 contractBalance = address(songDataBase).balance;
        uint256 operationFee = songDataBase.getOperationFee();

        assertEq(contractBalance, operationFee);

        //check amount on creator
        uint256 creatorOneBalance = address(CREATOR1.Address).balance;
        uint256 creatorTwoBalance = address(CREATOR2.Address).balance;

        assertEq(creatorOneBalance, songOne.price);
        assertEq(creatorTwoBalance, songTwo.price);
    }

    function test_unitCorrect_instaBuy() public setSongs {
        uint256[] memory songIds = new uint256[](1);
        songIds[0] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        songDataBase.instaBuy{value: totalPrice}(2, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 1);
        assertEq(userCollection[0], 2);

        SongDataBase.SongMetadata memory songOne = songDataBase.getSongMetadata(
            1
        );
        SongDataBase.SongMetadata memory songTwo = songDataBase.getSongMetadata(
            2
        );

        assertEq(songOne.timesBought, 0);
        assertEq(songTwo.timesBought, 1);

        //check amount on contract
        uint256 contractBalance = address(songDataBase).balance;
        uint256 operationFee = songDataBase.getOperationFee();

        assertEq(contractBalance, operationFee);

        //check amount on creator
        uint256 creatorOneBalance = address(CREATOR1.Address).balance;
        uint256 creatorTwoBalance = address(CREATOR2.Address).balance;

        assertEq(creatorOneBalance, 0);
        assertEq(creatorTwoBalance, songTwo.price);
    }

    function test_unitCorrect_proposeNewAdminAddress() public setSongs {
        vm.startPrank(ADMIN.Address);
        songDataBase.proposeNewAdminAddress(PROPOSED_ADMIN.Address);
        vm.stopPrank();

        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, PROPOSED_ADMIN.Address);
        assertEq(adminStruct.timeToExecuteProposal, block.timestamp + 1 days);
    }

    modifier proposeNewAdmin() {
        vm.startPrank(ADMIN.Address);
        songDataBase.proposeNewAdminAddress(PROPOSED_ADMIN.Address);
        vm.stopPrank();
        _;
    }

    function test_unitCorrect_cancelNewAdminAddress() public proposeNewAdmin {
        skip(2 hours);
        vm.startPrank(ADMIN.Address);
        songDataBase.cancelNewAdminAddress();
        vm.stopPrank();
        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, address(0));
        assertEq(adminStruct.timeToExecuteProposal, 0);
    }

    function test_unitCorrect_executeNewAdminAddress() public proposeNewAdmin {
        skip(1 days);
        vm.startPrank(ADMIN.Address);
        songDataBase.executeNewAdminAddress();
        vm.stopPrank();

        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, PROPOSED_ADMIN.Address);
        assertEq(adminStruct.proposed, address(0));
        assertEq(adminStruct.timeToExecuteProposal, 0);
    }

    modifier setSongsAndBuy() {
        songDataBase.newSong(
            "Test Song Number 1",
            "Creator one",
            "testMediaURIForSong1",
            "testMetadataURI1",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            1000
        );

        songDataBase.newSong(
            "Test Song Number 2",
            "Creator two",
            "testMediaURIForSong2",
            "testMetadataURI2",
            CREATOR2.Address,
            new string[](0),
            200,
            false,
            "",
            0
        );

        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 1;
        songIds[1] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);
        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        songDataBase.buy{value: totalPrice}(songIds, 777);
        vm.stopPrank();

        _;
    }

    function test_unitCorrect_withdraw() public setSongsAndBuy {
        uint256 contractBalanceBefore = address(songDataBase).balance;
        vm.startPrank(ADMIN.Address);
        songDataBase.withdraw(ADMIN.Address, contractBalanceBefore - 10);
        vm.stopPrank();
        uint256 contractBalanceAfter = address(songDataBase).balance;
        assertEq(contractBalanceAfter, 10);
        uint256 adminBalance = address(ADMIN.Address).balance;
        assertEq(adminBalance, contractBalanceBefore - 10);
    }
}
