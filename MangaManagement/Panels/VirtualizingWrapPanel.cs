using System;
using System.Windows;
using System.Windows.Controls;
using System.Windows.Controls.Primitives;
using System.Windows.Media;
using Size = System.Windows.Size;
using Point = System.Windows.Point;

namespace MangaManagement.Panels;

/// <summary>
/// WrapPanel 風のレイアウトで UI 仮想化を行うカスタムパネル。
/// </summary>
public class VirtualizingWrapPanel : VirtualizingPanel, IScrollInfo
{
    private ItemsControl? _itemsOwner;
    private Size _extent = new(0, 0);
    private Size _viewport = new(0, 0);
    private Point _offset;

    public VirtualizingWrapPanel()
    {
        CanVerticallyScroll = true;
    }

    protected override void OnInitialized(EventArgs e)
    {
        base.OnInitialized(e);
        _itemsOwner = ItemsControl.GetItemsOwner(this);
    }

    protected override Size MeasureOverride(Size availableSize)
    {
        if (_itemsOwner == null)
        {
            return availableSize;
        }

        var itemWidth = ItemWidth > 0 ? ItemWidth : availableSize.Width / 5.0;
        var itemHeight = ItemHeight > 0 ? ItemHeight : itemWidth * 1.35;

        var childrenPerRow = Math.Max(1, (int)(availableSize.Width / itemWidth));
        var itemCount = _itemsOwner.HasItems ? _itemsOwner.Items.Count : 0;

        // アイテムが無い場合は早期に返し、GeneratorPositionFromIndex での範囲外例外を防ぐ
        if (itemCount == 0)
        {
            _extent = new Size(availableSize.Width, 0);
            _viewport = availableSize;
            EnsureScrollOffsetWithinBounds();
            RemoveAllChildren();
            return availableSize;
        }

        var rowCount = (int)Math.Ceiling((double)itemCount / childrenPerRow);

        _extent = new Size(availableSize.Width, rowCount * itemHeight);
        _viewport = availableSize;

        EnsureScrollOffsetWithinBounds();
        var firstVisibleRow = (int)Math.Floor(VerticalOffset / itemHeight);
        var visibleRowCount = (int)Math.Ceiling(_viewport.Height / itemHeight) + 1;
        var startIndex = firstVisibleRow * childrenPerRow;
        // スクロール位置がアイテム数を超えている場合に備え、生成開始位置をクランプする
        startIndex = Math.Min(Math.Max(0, itemCount - 1), startIndex);
        var endIndex = Math.Min(itemCount, startIndex + visibleRowCount * childrenPerRow);

        var children = InternalChildren;
        var generator = ItemContainerGenerator;

        using (generator.StartAt(generator.GeneratorPositionFromIndex(startIndex), GeneratorDirection.Forward, true))
        {
            int childIndex = 0;
            for (int itemIndex = startIndex; itemIndex < endIndex; itemIndex++, childIndex++)
            {
                bool newlyRealized = false;
                var child = generator.GenerateNext(out newlyRealized) as UIElement;
                if (child == null)
                {
                    continue;
                }

                if (newlyRealized)
                {
                    if (childIndex >= children.Count)
                    {
                        AddInternalChild(child);
                    }
                    else
                    {
                        InsertInternalChild(childIndex, child);
                    }
                    generator.PrepareItemContainer(child);
                }

                child.Measure(new Size(itemWidth, itemHeight));
            }
        }

        while (InternalChildren.Count > endIndex - startIndex)
        {
            RemoveInternalChildRange(InternalChildren.Count - 1, 1);
        }

        return availableSize;
    }

    /// <summary>
    /// アイテムが存在しないときに内部要素をすべて削除する。
    /// </summary>
    private void RemoveAllChildren()
    {
        if (InternalChildren.Count > 0)
        {
            RemoveInternalChildRange(0, InternalChildren.Count);
        }
    }

    protected override Size ArrangeOverride(Size finalSize)
    {
        var itemWidth = ItemWidth > 0 ? ItemWidth : finalSize.Width / 5.0;
        var itemHeight = ItemHeight > 0 ? ItemHeight : itemWidth * 1.35;
        var childrenPerRow = Math.Max(1, (int)(finalSize.Width / itemWidth));

        for (int i = 0; i < InternalChildren.Count; i++)
        {
            var child = InternalChildren[i];
            int itemIndex = GetGeneratorIndexFromChildIndex(i);
            int row = itemIndex / childrenPerRow;
            int column = itemIndex % childrenPerRow;
            var rect = new Rect(column * itemWidth, row * itemHeight - VerticalOffset, itemWidth, itemHeight);
            child.Arrange(rect);
        }

        return finalSize;
    }

    private int GetGeneratorIndexFromChildIndex(int childIndex)
    {
        var startPos = ItemContainerGenerator.GeneratorPositionFromIndex(0);
        return startPos.Index + childIndex;
    }

    #region IScrollInfo
    public bool CanHorizontallyScroll { get; set; }
    public bool CanVerticallyScroll { get; set; }
    public double ExtentHeight => _extent.Height;
    public double ExtentWidth => _extent.Width;
    public double HorizontalOffset => _offset.X;
    public double VerticalOffset => _offset.Y;
    public double ViewportHeight => _viewport.Height;
    public double ViewportWidth => _viewport.Width;
    public ScrollViewer? ScrollOwner { get; set; }

    public void LineDown() => SetVerticalOffset(VerticalOffset + 16);
    public void LineUp() => SetVerticalOffset(VerticalOffset - 16);
    public void MouseWheelDown() => LineDown();
    public void MouseWheelUp() => LineUp();
    public void PageDown() => SetVerticalOffset(VerticalOffset + ViewportHeight);
    public void PageUp() => SetVerticalOffset(VerticalOffset - ViewportHeight);
    public void LineLeft() { }
    public void LineRight() { }
    public void MouseWheelLeft() { }
    public void MouseWheelRight() { }
    public void PageLeft() { }
    public void PageRight() { }

    public Rect MakeVisible(Visual visual, Rect rectangle)
    {
        return rectangle;
    }

    public void SetHorizontalOffset(double offset) { }

    public void SetVerticalOffset(double offset)
    {
        offset = Math.Max(0, Math.Min(offset, ExtentHeight - ViewportHeight));
        if (Math.Abs(offset - _offset.Y) > double.Epsilon)
        {
            _offset.Y = offset;
            InvalidateMeasure();
            ScrollOwner?.InvalidateScrollInfo();
        }
    }
    #endregion

    /// <summary>
    /// 各アイテムの幅（WPF の Binding が使えるよう DependencyProperty 化）。
    /// </summary>
    public double ItemWidth
    {
        get => (double)GetValue(ItemWidthProperty);
        set => SetValue(ItemWidthProperty, value);
    }

    /// <summary>
    /// 各アイテムの高さ（WPF の Binding が使えるよう DependencyProperty 化）。
    /// </summary>
    public double ItemHeight
    {
        get => (double)GetValue(ItemHeightProperty);
        set => SetValue(ItemHeightProperty, value);
    }

    public static readonly DependencyProperty ItemWidthProperty = DependencyProperty.Register(
        nameof(ItemWidth),
        typeof(double),
        typeof(VirtualizingWrapPanel),
        new FrameworkPropertyMetadata(double.NaN, FrameworkPropertyMetadataOptions.AffectsMeasure | FrameworkPropertyMetadataOptions.AffectsArrange));

    public static readonly DependencyProperty ItemHeightProperty = DependencyProperty.Register(
        nameof(ItemHeight),
        typeof(double),
        typeof(VirtualizingWrapPanel),
        new FrameworkPropertyMetadata(double.NaN, FrameworkPropertyMetadataOptions.AffectsMeasure | FrameworkPropertyMetadataOptions.AffectsArrange));

    private void EnsureScrollOffsetWithinBounds()
    {
        _offset.Y = Math.Max(0, Math.Min(_offset.Y, Math.Max(0, ExtentHeight - ViewportHeight)));
    }
}
