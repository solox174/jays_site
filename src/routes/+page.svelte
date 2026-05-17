<script>
    import working from '$lib/assets/images/working.jpeg';
</script>

<svelte:head>
    <title>Home</title>
</svelte:head>


<div class="glass-panel">
    Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae pellentesque sem
    placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor.
    <div style="float: right; width: 200px; border-radius: var(--border-radius); overflow: hidden; margin: 10px 0 8px 16px;">
        <img alt="working" src="{working}" style="display: block; width: 100%; height: auto;" />
    </div>
    Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer
    nunc posuere. Ut hendrerit semper vel class aptent taciti sociosqu. Ad litora torquent per conubia nostra
    inceptos himenaeos. Lorem ipsum dolor sit amet consectetur adipiscing elit. Quisque faucibus ex sapien vitae
    pellentesque sem
    placerat. In id cursus mi pretium tellus duis convallis. Tempus leo eu aenean sed diam urna tempor.
    Pulvinar vivamus fringilla lacus nec metus bibendum egestas. Iaculis massa nisl malesuada lacinia integer.
    <br/>
    <!-- layout works visually but is fragile: if the main copy grows significantly, on narrow screens this element
          will touch it. It also relies on an image width of 200px and padding of 24px. revisit approach if copy or
          image size changes. -->

    <div style="position: absolute; bottom: 20px; margin-right: 224px">
        <div style="margin-top: 20px">A few examples of the finishes we deliver across a range of vehicle conditions.
        </div>
        <a href="/portfolio">
            <button style="margin-top: 10px;">Results</button>
        </a>
    </div>
</div>


<div style="position: fixed; bottom: 35px; left: 0; right: 0; text-align: center; font-size: 0.75rem; padding: 0 10px; color: #aeaeae; pointer-events: none">
    Proudly serving the Valley of the Sun — Phoenix, Mesa, Chandler, Gilbert, Glendale, Peoria, Tempe, Scottsdale,
    Surprise &amp; El Mirage, AZ
</div>
