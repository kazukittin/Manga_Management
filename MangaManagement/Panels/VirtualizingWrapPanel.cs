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
/// 不正なスクロール位置や空データ時にも例外を発生させないようガードする。
/// </summary>
public class VirtualizingWrapPanel : VirtualizingPanel, IScrollInfo
{
    private ItemsControl? _itemsOwner;
    private Size _extent = new(0, 0);
    private Size _viewport = new(0, 0);
    private Point _offset;
    private int _firstIndex;

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
        _firstIndex = Math.Max(0, Math.Min(itemCount - 1, firstVisibleRow * childrenPerRow));
        var endIndex = Math.Min(itemCount, _firstIndex + visibleRowCount * childrenPerRow);

        var generator = ItemContainerGenerator;
        var startPos = generator.GeneratorPositionFromIndex(_firstIndex);
        int childIndex = 0;

        using (generator.StartAt(startPos, GeneratorDirection.Forward, true))
        {
            for (int itemIndex = _firstIndex; itemIndex < endIndex; itemIndex++, childIndex++)
            {
                bool newlyRealized = false;
                var child = generator.GenerateNext(out newlyRealized) as UIElement;
                if (child == null)
                {
                    continue;
                }

                if (newlyRealized)
                {
                    if (childIndex >= InternalChildren.Count)
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

        // 使われなくなった子要素を削除する
        while (InternalChildren.Count > endIndex - _firstIndex)
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
            int itemIndex = _firstIndex + i;
            int row = itemIndex / childrenPerRow;
            int column = itemIndex % childrenPerRow;
            var rect = new Rect(column * itemWidth, row * itemHeight - VerticalOffset, itemWidth, itemHeight);
            child.Arrange(rect);
        }

        return finalSize;
    }

    protected override void OnItemsChanged(object sender, ItemsChangedEventArgs args)
    {
        base.OnItemsChanged(sender, args);
        // 新しいアイテム追加や削除時はスクロール位置をリセットして計算し直す
        SetVerticalOffset(0);
        InvalidateMeasure();
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

    public Rect MakeVisible(Visual visual, Rect rectangle) => rectangle;

    public void SetHorizontalOffset(double offset) { }

    public void SetVerticalOffset(double offset)
    {
        offset = Math.Max(0, Math.Min(offset, Math.Max(0, ExtentHeight - ViewportHeight)));
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
