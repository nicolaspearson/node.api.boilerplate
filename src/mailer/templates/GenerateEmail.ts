import * as fs from 'fs';
import * as jsdom from 'jsdom';
import * as juice from 'juice';
import * as path from 'path';

import Guid from '../../utils/Guid';
import EmailStructure from '../models/EmailStructure';
import * as styles from './styles';

export default class GenerateEmail {
	public static async create(
		emailStructure: EmailStructure
	): Promise<string> {
		// tslint:disable max-line-length
		const dom = new jsdom.JSDOM(`<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">
		<html xmlns="http://www.w3.org/1999/xhtml">
			<head>
				<meta name="viewport" content="width=device-width" />
				<meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
				<title>${emailStructure.title}</title>
				${styles.getUnbrandedCss()}
			</head>
				<body class="">
				<div class="logo align-center">
					<svg width="100" height="100" class="app-brand-logo" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px"
						y="0px" fill="#3f51b5" viewBox="0 0 250 250" style="enable-background:new 0 0 250 250;" xml:space="preserve">
						<g>
							<g>
								<polygon class="st0" points="125,153.4 100.3,153.4 88.6,182.6 88.6,182.6 66.9,182.6 66.8,182.6 125,52.1 125,52.2 125,52.2
								125,30 125,30 31.9,63.2 46.1,186.3 125,230 125,230 125,153.4" />
								<polygon class="st0" points="108,135.4 125,135.4 125,135.4 125,94.5" />
							</g>
							<g class="st1">
								<polygon class="st0" points="125,153.4 149.7,153.4 161.4,182.6 161.4,182.6 183.1,182.6 183.2,182.6 125,52.1 125,52.2 125,52.2
								125,30 125,30 218.1,63.2 203.9,186.3 125,230 125,230 125,153.4" />
								<polygon class="st0" points="142,135.4 125,135.4 125,135.4 125,94.5" />
							</g>
						</g>
					</svg>
				</div>
				<table border="0" cellpadding="0" cellspacing="0" class="body">
					<tr>
						<td>&nbsp;</td>
						<td class="container">
							<div class="content">

								<!-- START CENTERED WHITE CONTAINER -->
								<span class="preheader">${emailStructure.previewText}</span>
								<table class="main">

									<!-- START MAIN CONTENT AREA -->
									<tr>
										<td class="wrapper">
											<table border="0" cellpadding="0" cellspacing="0">
												<tr>
													<td>
														<h1>${emailStructure.title}</h1>
														<p>${emailStructure.contentTop}</p>
														<br>
														<table border="0" cellpadding="0" cellspacing="0" class="btn btn-primary">
															<tbody>
																<tr>
																	<td align="center">
																		<table border="0" cellpadding="0" cellspacing="0">
																			<tbody>
																				<tr>
																					<td>
																						<a href="${emailStructure.ctaLink}"
																						target="_blank">${emailStructure.ctaText}</a>
																					</td>
																				</tr>
																			</tbody>
																		</table>
																	</td>
																</tr>
															</tbody>
														</table>
														<br>
														<p>${emailStructure.contentBottom}</p>
														<br>
														<p>Regards,
														<br>Support Team
														</p>
													</td>
												</tr>
											</table>
										</td>
									</tr>

									<!-- END MAIN CONTENT AREA -->
								</table>

								<!-- START FOOTER -->
								<div class="footer">
									<table border="0" cellpadding="0" cellspacing="0">
										<tr>
											<td class="content-block">
												<span class="apple-link">Node API Boilerplate, 105 Main Street, Cape Town, South Africa</span>
											</td>
										</tr>
										<tr>
											<td class="content-block powered-by">
												Powered by
												<a href="javascript:;">Node API Boilerplate</a>
											</td>
										</tr>
									</table>
								</div>
								<!-- END FOOTER -->

								<!-- END CENTERED WHITE CONTAINER -->
							</div>
						</td>
						<td>&nbsp;</td>
					</tr>
				</table>
			</body>
		</html>`);

		const email = juice(dom.serialize(), {
			applyStyleTags: true
		});
		const filePath = `dist/${emailStructure.title}-${Guid.newGuid()}.html`;
		fs.writeFile(path.resolve(filePath), email, error => {
			if (error) {
				// tslint:disable no-console
				console.log(error);
			}
		});
		return email;
	}
}
