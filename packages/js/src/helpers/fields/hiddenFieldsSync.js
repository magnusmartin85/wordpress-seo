/* eslint-disable camelcase */
import { select, subscribe } from "@wordpress/data";
import { debounce, forEach, pickBy } from "lodash";
import createWatcher, { createCollectorFromObject } from "../../helpers/create-watcher";
import { STORE, SYNC_TIME } from "../../constants";
import { getFacebookImageId, getFacebookTitle, getFacebookDescription, getFacebookImageUrl } from "./facebookFieldsStore";
import { getTwitterImageId, getTwitterTitle, getTwitterDescription, getTwitterImageUrl } from "./twitterFieldsStore";
import { getPageType, getArticleType } from "./schemaFieldsStore";
import { getFocusKeyphrase, isCornerstoneContent, getReadabilityScore, getSeoScore, getInclusiveLanguageScore } from "./analysisFieldsStore";
import { getNoIndex, getNoFollow, getAdvanced, getBreadcrumbsTitle, getCanonical, getWordProofTimestamp } from "./advancedFieldsStore";

/**
 * Retrieves the no index value.
 *
 * @returns {integer} The no index value.
 */
const getPrimaryCategoryId = () => String( select( STORE )?.getPrimaryTaxonomyId( "category" ) );


/**
 * Creates an updater.
 * @returns {function} The updater.
 */
const createUpdater = () => {
	/**
	 * Syncs the data to the WP entity record.
	 * @param {Object} data The collected data.
	 * @returns {void}
	 */
	return ( data ) => {
		// Get the values from hidden fields.
		const metadata = {};
		const wpseoMetaElement = document.getElementById( "wpseo_meta" );
		const inside = wpseoMetaElement?.querySelector( ".inside" );
		const hiddenFields = inside?.querySelectorAll( "input[type=hidden]" );
		forEach( hiddenFields, ( field ) => {
			metadata[ field.id ] = field.value;
		} );

		if ( ! metadata || ! data ) {
			return;
		}
		console.log( { data } );
		console.log( { metadata } );
		const prefix = "yoast_wpseo_";

		const changedData = pickBy( data, ( value, key ) => value !== metadata[ prefix + key ] );
		console.log( { changedData } );

		if ( changedData ) {
			forEach( changedData, ( value, key ) => {
				document.getElementById( prefix + key ).value = value;
			} );
		}
	};
};

/**
 * Initializes the sync: from Yoast editor store to product metadata.
 * @returns {function} The un-subscriber.
 */
export const blockEditorSync = () => {
	return subscribe( debounce( createWatcher(
		createCollectorFromObject( {
			focuskw: getFocusKeyphrase,
			"meta-robots-noindex": getNoIndex,
			"meta-robots-nofollow": getNoFollow,
			primary_category: getPrimaryCategoryId,
			"opengraph-title": getFacebookTitle,
			"opengraph-description": getFacebookDescription,
			"opengraph-image": getFacebookImageUrl,
			"opengraph-image-id": getFacebookImageId,
			"twitter-title": getTwitterTitle,
			"twitter-description": getTwitterDescription,
			"twitter-image": getTwitterImageUrl,
			"twitter-image-id": getTwitterImageId,
			schema_page_type: getPageType,
			schema_article_type: getArticleType,
			is_cornerstone: isCornerstoneContent,
			content_score: getReadabilityScore,
			linkdex: getSeoScore,
			inclusive_language_score: getInclusiveLanguageScore,
			"meta-robots-adv": getAdvanced,
			bctitle: getBreadcrumbsTitle,
			wpseo_canonical: getCanonical,
			wordproof_timestamp: getWordProofTimestamp,

		} ),
		createUpdater()
	), SYNC_TIME.wait, { maxWait: SYNC_TIME.max } ), STORE );
};