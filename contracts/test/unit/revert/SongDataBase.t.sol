// SPDX-License-Identifier: UNLICENSED
pragma solidity ^0.8.13;

import {Test, console} from "forge-std/Test.sol";
import {SongDataBase} from "@shine/SongDataBase.sol";
import {Constants} from "../../Constants.sol";
import {ErrorsLib} from "@shine/lib/ErrorsLib.sol";
import {SafeTransferLib} from "@solady/utils/SafeTransferLib.sol";

contract SongDataBaseTest is Test, Constants {
    SongDataBase public songDataBase;

    function setUp() public {
        songDataBase = new SongDataBase(ADMIN.Address);
    }

    function test_unitRevert_newSong_InvalidMetadataInput_title() public {
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.newSong(
            "",
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

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(1);
    }

    function test_unitRevert_newSong_InvalidMetadataInput_artistName() public {
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.newSong(
            "Song Title",
            "",
            "mediaURI",
            "metadataURI",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            1000
        );

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(1);
    }

    function test_unitRevert_newSong_InvalidMetadataInput_mediaURI() public {
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.newSong(
            "Song Title",
            "Artist Name",
            "",
            "metadataURI",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            1000
        );

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(1);
    }

    function test_unitRevert_newSong_InvalidMetadataInput_metadataURI() public {
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.newSong(
            "Song Title",
            "Artist Name",
            "mediaURI",
            "",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            1000
        );

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(1);
    }

    function test_unitRevert_newSong_InvalidMetadataInput_artistAddress()
        public
    {
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.newSong(
            "Song Title",
            "Artist Name",
            "mediaURI",
            "metadataURI",
            address(0),
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            1000
        );

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(1);
    }

    function test_unitRevert_newSong_InvalidMetadataInput_isAnSpecialEdition_specialEditionName()
        public
    {
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.newSong(
            "Song Title",
            "Artist Name",
            "mediaURI",
            "metadataURI",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "",
            1000
        );

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(1);
    }

    function test_unitRevert_newSong_InvalidMetadataInput_isAnSpecialEdition_maxSupplySpecialEdition()
        public
    {
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.newSong(
            "Song Title",
            "Artist Name",
            "mediaURI",
            "metadataURI",
            CREATOR1.Address,
            new string[](0),
            100,
            true,
            "Super omega ultra special remake and Knuckles edition (new funky mode)",
            0
        );

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(1);
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
            1
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

        songDataBase.newSong(
            "Test Song Number 3",
            "Creator three",
            "testMediaURIForSong3",
            "testMetadataURI3",
            CREATOR3.Address,
            new string[](0),
            300,
            false,
            "",
            0
        );

        _;
    }

    function test_unitCorrect_editSongMetadata_InvalidSongId() public setSongs {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR1.Address);

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.editSongMetadata(
            999, // Invalid song ID
            "Edited Song Title",
            "Edited Artist Name",
            "editedMediaURI",
            "editedMetadataURI",
            CREATOR2.Address,
            newTags,
            150
        );

        vm.stopPrank();
    }

    function test_unitCorrect_editSongMetadata_SenderIsNotAuthorized()
        public
        setSongs
    {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR2.Address);
        vm.expectRevert(ErrorsLib.SenderIsNotAuthorized.selector);
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
        assertEq(song.title, "Test Song Number 1");
        assertEq(song.artistName, "Creator one");
        assertEq(song.mediaURI, "testMediaURIForSong1");
        assertEq(song.metadataURI, "testMetadataURI1");
        assertEq(song.artistAddress, CREATOR1.Address);
        assertEq(song.price, 100);
        assertEq(song.timesBought, 0);
        assertEq(song.tags.length, 0);
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1);
    }

    function test_unitCorrect_editSongMetadata_InvalidMetadataInput_title()
        public
        setSongs
    {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR1.Address);
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.editSongMetadata(
            1,
            "",
            "Edited Artist Name",
            "editedMediaURI",
            "editedMetadataURI",
            CREATOR2.Address,
            newTags,
            150
        );
        vm.stopPrank();

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);
        assertEq(song.title, "Test Song Number 1");
        assertEq(song.artistName, "Creator one");
        assertEq(song.mediaURI, "testMediaURIForSong1");
        assertEq(song.metadataURI, "testMetadataURI1");
        assertEq(song.artistAddress, CREATOR1.Address);
        assertEq(song.price, 100);
        assertEq(song.tags.length, 0);
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1);
    }

    function test_unitCorrect_editSongMetadata_InvalidMetadataInput_artistName()
        public
        setSongs
    {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR1.Address);
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.editSongMetadata(
            1,
            "Edited Song Title",
            "",
            "editedMediaURI",
            "editedMetadataURI",
            CREATOR2.Address,
            newTags,
            150
        );
        vm.stopPrank();

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);
        assertEq(song.title, "Test Song Number 1");
        assertEq(song.artistName, "Creator one");
        assertEq(song.mediaURI, "testMediaURIForSong1");
        assertEq(song.metadataURI, "testMetadataURI1");
        assertEq(song.artistAddress, CREATOR1.Address);
        assertEq(song.price, 100);
        assertEq(song.tags.length, 0);
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1);
    }

    function test_unitCorrect_editSongMetadata_InvalidMetadataInput_mediaURI()
        public
        setSongs
    {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR1.Address);
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.editSongMetadata(
            1,
            "Edited Song Title",
            "Edited Artist Name",
            "",
            "editedMetadataURI",
            CREATOR2.Address,
            newTags,
            150
        );
        vm.stopPrank();

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);
        assertEq(song.title, "Test Song Number 1");
        assertEq(song.artistName, "Creator one");
        assertEq(song.mediaURI, "testMediaURIForSong1");
        assertEq(song.metadataURI, "testMetadataURI1");
        assertEq(song.artistAddress, CREATOR1.Address);
        assertEq(song.price, 100);
        assertEq(song.tags.length, 0);
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1);
    }

    function test_unitCorrect_editSongMetadata_InvalidMetadataInput_metadataURI()
        public
        setSongs
    {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR1.Address);
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.editSongMetadata(
            1,
            "Edited Song Title",
            "Edited Artist Name",
            "editedMediaURI",
            "",
            CREATOR2.Address,
            newTags,
            150
        );
        vm.stopPrank();

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);
        assertEq(song.title, "Test Song Number 1");
        assertEq(song.artistName, "Creator one");
        assertEq(song.mediaURI, "testMediaURIForSong1");
        assertEq(song.metadataURI, "testMetadataURI1");
        assertEq(song.artistAddress, CREATOR1.Address);
        assertEq(song.price, 100);
        assertEq(song.tags.length, 0);
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1);
    }

    function test_unitCorrect_editSongMetadata_InvalidMetadataInput_artistAddress()
        public
        setSongs
    {
        string[] memory newTags = new string[](1);
        newTags[0] = "editedTag";

        vm.startPrank(CREATOR1.Address);
        vm.expectRevert(ErrorsLib.InvalidMetadataInput.selector);
        songDataBase.editSongMetadata(
            1,
            "Edited Song Title",
            "Edited Artist Name",
            "editedMediaURI",
            "editedMetadataURI",
            address(0),
            newTags,
            150
        );
        vm.stopPrank();


        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);
    
        assertEq(song.title, "Test Song Number 1");
        assertEq(song.artistName, "Creator one");
        assertEq(song.mediaURI, "testMediaURIForSong1");
        assertEq(song.metadataURI, "testMetadataURI1");
        assertEq(song.artistAddress, CREATOR1.Address);
        assertEq(song.price, 100);
        assertEq(song.tags.length, 0);
        assert(song.isAnSpecialEdition);
        assertEq(
            song.specialEditionName,
            "Super omega ultra special remake and Knuckles edition (new funky mode)"
        );
        assertEq(song.maxSupplySpecialEdition, 1);
    }

    function test_unitRevert_buy_ListIsEmpty() public setSongs {
        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 1;
        songIds[1] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);

        vm.expectRevert(ErrorsLib.ListIsEmpty.selector);
        songDataBase.buy{value: totalPrice}(new uint256[](0), 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 0);

        SongDataBase.SongMetadata memory songOne = songDataBase.getSongMetadata(
            1
        );
        SongDataBase.SongMetadata memory songTwo = songDataBase.getSongMetadata(
            2
        );

        assertEq(songOne.timesBought, 0);
        assertEq(songTwo.timesBought, 0);

        uint256 contractBalance = address(songDataBase).balance;

        assertEq(contractBalance, 0);

        uint256 creatorOneBalance = address(CREATOR1.Address).balance;
        uint256 creatorTwoBalance = address(CREATOR2.Address).balance;

        assertEq(creatorOneBalance, 0);
        assertEq(creatorTwoBalance, 0);
    }

    function test_unitRevert_buy_InvalidSongId() public setSongs {
        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 1;
        songIds[1] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        songIds[1] = 999; // Invalid song ID

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.buy{value: totalPrice}(songIds, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 0);

        SongDataBase.SongMetadata memory songOne = songDataBase.getSongMetadata(
            1
        );
        SongDataBase.SongMetadata memory songTwo = songDataBase.getSongMetadata(
            2
        );

        assertEq(songOne.timesBought, 0);
        assertEq(songTwo.timesBought, 0);

        uint256 contractBalance = address(songDataBase).balance;

        assertEq(contractBalance, 0);

        uint256 creatorOneBalance = address(CREATOR1.Address).balance;
        uint256 creatorTwoBalance = address(CREATOR2.Address).balance;

        assertEq(creatorOneBalance, 0);
        assertEq(creatorTwoBalance, 0);
    }

    function test_unitRevert_buy_EspecialEditionMaxSupplyReached()
        public
        setSongs
    {
        ////////////////////////////////////

        uint256[] memory songIdsUserTwo = new uint256[](1);
        songIdsUserTwo[0] = 1;
        uint256 totalPriceUserTwo = songDataBase.getTotalPriceForBuy(
            songIdsUserTwo
        );

        vm.deal(USER2.Address, totalPriceUserTwo);
        vm.startPrank(USER2.Address);
        songDataBase.instaBuy{value: totalPriceUserTwo}(1, 888);
        vm.stopPrank();

        ////////////////////////////////////

        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 1;
        songIds[1] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.EspecialEditionMaxSupplyReached.selector);
        songDataBase.buy{value: totalPrice}(songIds, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 0);

        SongDataBase.SongMetadata memory songOne = songDataBase.getSongMetadata(
            1
        );
        SongDataBase.SongMetadata memory songTwo = songDataBase.getSongMetadata(
            2
        );

        assertEq(songOne.timesBought, 1);
        assertEq(songTwo.timesBought, 0);

        uint256 contractBalance = address(songDataBase).balance;
        uint256 operationFee = songDataBase.getOperationFee();

        assertEq(contractBalance, operationFee);

        uint256 creatorOneBalance = address(CREATOR1.Address).balance;
        uint256 creatorTwoBalance = address(CREATOR2.Address).balance;

        assertEq(creatorOneBalance, songOne.price);
        assertEq(creatorTwoBalance, 0);
    }

    function test_unitRevert_buy_UserOwnsSong() public setSongs {
        ////////////////////////////////////

        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 2;
        songIds[1] = 3;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        songDataBase.buy{value: totalPrice}(songIds, 777);
        vm.stopPrank();

        ////////////////////////////////////

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.UserOwnsSong.selector);
        songDataBase.buy{value: totalPrice}(songIds, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 2);

        SongDataBase.SongMetadata memory songOne = songDataBase.getSongMetadata(
            2
        );
        SongDataBase.SongMetadata memory songTwo = songDataBase.getSongMetadata(
            3
        );

        assertEq(songOne.timesBought, 1);
        assertEq(songTwo.timesBought, 1);

        uint256 contractBalance = address(songDataBase).balance;
        uint256 operationFee = songDataBase.getOperationFee();

        assertEq(contractBalance, operationFee);

        uint256 creatorOneBalance = address(CREATOR2.Address).balance;
        uint256 creatorTwoBalance = address(CREATOR3.Address).balance;

        assertEq(creatorOneBalance, songOne.price);
        assertEq(creatorTwoBalance, songTwo.price);
    }

    function test_unitRevert_buy_AmountTooLow() public setSongs {
        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 1;
        songIds[1] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        uint256 operationFee = songDataBase.getOperationFee();

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(
            abi.encodeWithSelector(
                ErrorsLib.AmountTooLow.selector,
                totalPrice - operationFee,
                totalPrice
            )
        );
        songDataBase.buy{value: totalPrice - operationFee}(songIds, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 0);

        SongDataBase.SongMetadata memory songOne = songDataBase.getSongMetadata(
            1
        );
        SongDataBase.SongMetadata memory songTwo = songDataBase.getSongMetadata(
            2
        );

        assertEq(songOne.timesBought, 0);
        assertEq(songTwo.timesBought, 0);

        uint256 contractBalance = address(songDataBase).balance;

        assertEq(contractBalance, 0);

        uint256 creatorOneBalance = address(CREATOR1.Address).balance;
        uint256 creatorTwoBalance = address(CREATOR2.Address).balance;

        assertEq(creatorOneBalance, 0);
        assertEq(creatorTwoBalance, 0);
    }

    function test_unitRevert_instaBuy_InvalidSongId() public setSongs {
        uint256[] memory songIds = new uint256[](1);
        songIds[0] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.instaBuy{value: totalPrice}(999, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 0);

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);

        assertEq(song.timesBought, 0);

        //check amount on contract
        uint256 contractBalance = address(songDataBase).balance;

        assertEq(contractBalance, 0);

        //check amount on creator
        uint256 creatorBalance = address(CREATOR1.Address).balance;

        assertEq(creatorBalance, 0);
    }

    function test_unitRevert_instaBuy_EspecialEditionMaxSupplyReached()
        public
        setSongs
    {
        ////////////////////////////////////

        uint256[] memory songIdsUserTwo = new uint256[](1);
        songIdsUserTwo[0] = 1;
        uint256 totalPriceUserTwo = songDataBase.getTotalPriceForBuy(
            songIdsUserTwo
        );

        vm.deal(USER2.Address, totalPriceUserTwo);
        vm.startPrank(USER2.Address);
        songDataBase.instaBuy{value: totalPriceUserTwo}(1, 888);
        vm.stopPrank();

        ////////////////////////////////////

        uint256[] memory songIds = new uint256[](1);
        songIds[0] = 1;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.EspecialEditionMaxSupplyReached.selector);
        songDataBase.instaBuy{value: totalPrice}(1, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 0);

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(1);

        assertEq(song.timesBought, 1);

        uint256 contractBalance = address(songDataBase).balance;
        uint256 operationFee = songDataBase.getOperationFee();

        assertEq(contractBalance, operationFee);

        uint256 creatorBalance = address(CREATOR1.Address).balance;

        assertEq(creatorBalance, song.price);
    }

    function test_unitRevert_instaBuy_UserOwnsSong() public setSongs {
        uint256[] memory songIds = new uint256[](1);
        songIds[0] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);

        /////////////////////////////////////
        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        songDataBase.instaBuy{value: totalPrice}(2, 777);
        vm.stopPrank();
        /////////////////////////////////////

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.UserOwnsSong.selector);
        songDataBase.instaBuy{value: totalPrice}(2, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 1);
        assertEq(userCollection[0], 2);

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(2);

        assertEq(song.timesBought, 1);

        uint256 contractBalance = address(songDataBase).balance;
        uint256 operationFee = songDataBase.getOperationFee();

        assertEq(contractBalance, operationFee);
        uint256 creatorBalance = address(CREATOR2.Address).balance;

        assertEq(creatorBalance, song.price);
    }

    function test_unitRevert_instaBuy_AmountTooLow() public setSongs {
        uint256[] memory songIds = new uint256[](1);
        songIds[0] = 2;
        uint256 totalPrice = songDataBase.getTotalPriceForBuy(songIds);
        uint256 operationFee = songDataBase.getOperationFee();

        vm.deal(USER1.Address, totalPrice);
        vm.startPrank(USER1.Address);
        vm.expectRevert(
            abi.encodeWithSelector(
                ErrorsLib.AmountTooLow.selector,
                totalPrice - operationFee,
                totalPrice
            )
        );
        songDataBase.instaBuy{value: totalPrice - operationFee}(2, 777);
        vm.stopPrank();

        uint256[] memory userCollection = songDataBase.getUserCollection(777);

        assertEq(userCollection.length, 0);

        SongDataBase.SongMetadata memory song = songDataBase.getSongMetadata(2);

        assertEq(song.timesBought, 0);

        uint256 contractBalance = address(songDataBase).balance;

        assertEq(contractBalance, 0);
        uint256 creatorBalance = address(CREATOR1.Address).balance;

        assertEq(creatorBalance, 0);
    }

    function test_unitRevert_proposeNewAdminAddress_SenderIsNotAuthorized()
        public
        setSongs
    {
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.SenderIsNotAuthorized.selector);
        songDataBase.proposeNewAdminAddress(PROPOSED_ADMIN.Address);
        vm.stopPrank();

        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, address(0));
        assertEq(adminStruct.timeToExecuteProposal, 0);
    }

    function test_unitRevert_proposeNewAdminAddress_NewAdminAddressCannotBeZero()
        public
        setSongs
    {
        vm.startPrank(ADMIN.Address);
        vm.expectRevert(ErrorsLib.NewAdminAddressCannotBeZero.selector);
        songDataBase.proposeNewAdminAddress(address(0));
        vm.stopPrank();

        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, address(0));
        assertEq(adminStruct.timeToExecuteProposal, 0);
    }

    modifier proposeNewAdmin() {
        vm.startPrank(ADMIN.Address);
        songDataBase.proposeNewAdminAddress(PROPOSED_ADMIN.Address);
        vm.stopPrank();
        _;
    }

    function test_unitRevert_cancelNewAdminAddress_SenderIsNotAuthorized()
        public
        proposeNewAdmin
    {
        skip(2 hours);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.SenderIsNotAuthorized.selector);
        songDataBase.cancelNewAdminAddress();
        vm.stopPrank();
        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, PROPOSED_ADMIN.Address);
        assertEq(
            adminStruct.timeToExecuteProposal,
            block.timestamp + 1 days - 2 hours
        );
    }

    function test_unitRevert_executeNewAdminAddress_NewAdminNotProposed()
        public
    {
        skip(1 days);
        vm.startPrank(ADMIN.Address);
        vm.expectRevert(ErrorsLib.NewAdminNotProposed.selector);
        songDataBase.executeNewAdminAddress();
        vm.stopPrank();

        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, address(0));
        assertEq(adminStruct.timeToExecuteProposal, 0);
    }

    function test_unitRevert_executeNewAdminAddress_TimeToExecuteProposalNotReached()
        public
        proposeNewAdmin
    {
        skip(1 hours);
        vm.startPrank(ADMIN.Address);
        vm.expectRevert(ErrorsLib.TimeToExecuteProposalNotReached.selector);
        songDataBase.executeNewAdminAddress();
        vm.stopPrank();

        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, PROPOSED_ADMIN.Address);
        assertEq(
            adminStruct.timeToExecuteProposal,
            block.timestamp + 1 days - 1 hours
        );
    }

    function test_unitRevert_executeNewAdminAddress_SenderIsNotAuthorized()
        public
        proposeNewAdmin
    {
        skip(1 days);
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.SenderIsNotAuthorized.selector);
        songDataBase.executeNewAdminAddress();
        vm.stopPrank();

        SongDataBase.AddressTypeProposal memory adminStruct = songDataBase
            .getAdminStructure();

        assertEq(adminStruct.current, ADMIN.Address);
        assertEq(adminStruct.proposed, PROPOSED_ADMIN.Address);
        assertEq(adminStruct.timeToExecuteProposal, block.timestamp);
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

    function test_unitRevert_withdraw_SenderIsNotAuthorized()
        public
        setSongsAndBuy
    {
        uint256 contractBalanceBefore = address(songDataBase).balance;
        vm.startPrank(USER1.Address);
        vm.expectRevert(ErrorsLib.SenderIsNotAuthorized.selector);
        songDataBase.withdraw(ADMIN.Address, contractBalanceBefore);
        vm.stopPrank();
        uint256 contractBalanceAfter = address(songDataBase).balance;
        assertEq(contractBalanceAfter, contractBalanceBefore);
        uint256 adminBalance = address(ADMIN.Address).balance;
        assertEq(adminBalance, 0);
    }

    function test_unitRevert_withdraw_AdminCantBurnEth() public setSongsAndBuy {
        uint256 contractBalanceBefore = address(songDataBase).balance;
        vm.startPrank(ADMIN.Address);
        vm.expectRevert(ErrorsLib.AdminCantBurnEth.selector);
        songDataBase.withdraw(address(0), contractBalanceBefore);
        vm.stopPrank();
        uint256 contractBalanceAfter = address(songDataBase).balance;
        assertEq(contractBalanceAfter, contractBalanceBefore);
        uint256 adminBalance = address(0).balance;
        assertEq(adminBalance, 0);
    }

    function test_unitRevert_withdraw_AmountCannotBeZero()
        public
        setSongsAndBuy
    {
        uint256 contractBalanceBefore = address(songDataBase).balance;
        vm.startPrank(ADMIN.Address);
        vm.expectRevert(ErrorsLib.AmountCannotBeZero.selector);
        songDataBase.withdraw(ADMIN.Address, 0);
        vm.stopPrank();
        uint256 contractBalanceAfter = address(songDataBase).balance;
        assertEq(contractBalanceAfter, contractBalanceBefore);
        uint256 adminBalance = address(ADMIN.Address).balance;
        assertEq(adminBalance, 0);
    }

    function test_unitRevert_withdraw_ETHTransferFailed()
        public
        setSongsAndBuy
    {
        uint256 contractBalanceBefore = address(songDataBase).balance;
        vm.startPrank(ADMIN.Address);
        vm.expectRevert(SafeTransferLib.ETHTransferFailed.selector);
        songDataBase.withdraw(ADMIN.Address, contractBalanceBefore + 10);
        vm.stopPrank();
        uint256 contractBalanceAfter = address(songDataBase).balance;
        assertEq(contractBalanceAfter, contractBalanceBefore);
        uint256 adminBalance = address(ADMIN.Address).balance;
        assertEq(adminBalance, 0);
    }

    function test_unitRevert_getTotalPriceForBuy_InvalidSongId()
        public
        setSongs
    {
        uint256[] memory songIds = new uint256[](2);
        songIds[0] = 1;
        songIds[1] = 999; // Invalid song ID

        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getTotalPriceForBuy(songIds);
    }

    function test_unitRevert_getSongMetadata_InvalidSongId() public setSongs {
        vm.expectRevert(ErrorsLib.InvalidSongId.selector);
        songDataBase.getSongMetadata(999);
    }
}
