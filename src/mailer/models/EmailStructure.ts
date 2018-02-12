export default class EmailStructure {
	public title: string;
	public previewText: string;
	public contentTop: string;
	public contentBottom: string;
	public ctaText: string;
	public ctaLink: string;

	constructor(
		title: string,
		previewText: string,
		contentTop: string,
		contentBottom: string,
		ctaText: string,
		ctaLink: string
	) {
		this.title = title;
		this.previewText = previewText;
		this.contentTop = contentTop;
		this.contentBottom = contentBottom;
		this.ctaText = ctaText;
		this.ctaLink = ctaLink;
	}
}
