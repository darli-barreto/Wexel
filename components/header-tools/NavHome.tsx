import {
  Paste,
  Spacer,
  Paper,
  PaintBrush,
  FontFamily,
  FontSize,
  FontChoiceBig,
  FontChoiceLitle,
  FontMayus,
  FontEraser,
  FontBold,
  FontItalic,
  FontUnderline,
  FontCrossedOut,
  SubScript,
  SuperScript,
  TextEffects,
  TextHighlightColor,
  FontColor,
  Bullets,
  Numbering,
  MultilevelList,
  DecreaseIndent,
  IncreaseIndent,
  Sort,
  ShowHide,
  AlingLeft,
  AlingCenter,
  AlingRight,
  AlingJustify,
  AlingParagraphSpacing,
  Shading,
  Borders,
  Styles,
  TopAling,
  MiddleAling,
  BottomAling,
  WrapText,
  MergeCenter,
  Orientation,
  StyleMoney,
  StylePercent,
  ConditionalFormating,
  InsertCells,
  IncreaseDecimal,
  DecreaseDecimal,
  DeleteCells,
  FormatTable,
  CommaStyle,
  CellStyles,
  FormatStyles,
  Sum,
  Fill,
  Clear,
  SortFilter,
  FindSelect,
  Dictate,
  AddIns,
  SeparatorOne,
  SeparatorTwo,
} from "./index";

function NavHome() {
  return (
    <div className="flex h-14.5 mt-2.5 items-center min-w-max">
      {/* Section 0 */}
      <div className="flex ml-2 space-x-3 ">
        <Paste />
        <div className="flex space-y-1 space-x-1 flex-col">
          <Spacer />
          <Paper />
          <PaintBrush />
        </div>
      </div>
      <SeparatorOne />

      {/* Section 1 */}
      <div className="flex-col">
        <div className="flex space-x-2.5 py-1">
          <div className="flex space-x-1">
            <FontFamily />
            <FontSize />
          </div>
          <div className="flex items-center space-x-2.5 justify-center">
            <FontChoiceBig />
            <FontChoiceLitle />
            <SeparatorTwo />
            <FontMayus />
            <FontEraser />
          </div>
        </div>
        <div className="flex items-center space-x-3.5 mt-1.5">
          <FontBold />
          <FontItalic />
          <FontUnderline />
          <FontCrossedOut />
          <SubScript />
          <SuperScript />
          <SeparatorTwo />
          <TextEffects />
          <TextHighlightColor />
          <FontColor />
        </div>
      </div>
      <SeparatorOne />

      {/* Section 2 */}
      <div className="">
        <div className="flex space-x-2.5 py-1">
          <div className="flex items-center space-x-3 justify-center">
            <Bullets />
            <Numbering />
            <MultilevelList />
            <SeparatorTwo />
            <DecreaseIndent />
            <IncreaseIndent />
            <SeparatorTwo />
            <Sort />
            <SeparatorTwo />
            <ShowHide />
          </div>
        </div>
        <div className="flex items-center space-x-3.5 mt-3">
          <AlingLeft />
          <AlingCenter />
          <AlingRight />
          <AlingJustify />
          <SeparatorTwo />
          <AlingParagraphSpacing />
          <SeparatorTwo />
          <Shading />
          <Borders />
        </div>
      </div>
      <SeparatorOne />

      {/* Style Section 3 */}
      <Styles />
      <SeparatorOne />
      {/* Excel 1 */}
      <div className="">
        <div className="flex items-center space-x-3.5">
          <TopAling />
          <MiddleAling />
          <BottomAling />
          <WrapText />
        </div>
        <div className="flex items-center space-x-3.5 mt-1">
          <AlingLeft />
          <AlingCenter />
          <AlingRight />
          <MergeCenter />
        </div>
        <div className="flex items-center space-x-3.5 mt-1">
          <DecreaseIndent />
          <IncreaseIndent />
          <div className="w-3 h-full"></div>
          <Orientation />
        </div>
      </div>
      <SeparatorOne />
      {/* Excel 1 */}
      <div className="">
        <div className="flex items-center space-x-3.5">
          <StyleMoney />
          <StylePercent />
          <ConditionalFormating />
          <InsertCells />
        </div>
        <div className="flex items-center space-x-3.5 mt-1">
          <IncreaseDecimal />
          <DecreaseDecimal />
          <FormatTable />
          <DeleteCells />
        </div>
        <div className="flex items-center space-x-3.5 mt-1">
          <CommaStyle />
          <div className="w-5.5 h-full"></div>
          <CellStyles />
          <FormatStyles />
        </div>
      </div>
      <SeparatorOne />
      {/* Excel 1 */}
      <div className="flex flex-col">
        <Sum />
        <Fill />
        <Clear />
      </div>
      <SeparatorOne />
      <SortFilter />
      <SeparatorOne />
      <FindSelect />
      <SeparatorOne />
      {/* Tolls */}
      <Dictate />
      <SeparatorOne />
      <AddIns />
      <SeparatorOne />
    </div>
  );
}

export default NavHome;
